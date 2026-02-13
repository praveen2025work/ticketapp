package com.enterprise.fast.config;

import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.UserRole;
import com.enterprise.fast.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

/**
 * Filter to handle Windows LDAP authentication.
 * Extracts the authenticated user from the request headers and loads user
 * details from the database.
 * If user is not found in database, grants READ_ONLY access.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LdapAuthenticationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Extract username from Windows authentication header
            // Common headers: REMOTE_USER, X-Authenticated-User, or custom header
            String username = extractUsername(request);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                log.debug("Processing LDAP authentication for user: {}", username);

                // Look up user in database
                Optional<User> userOptional = userRepository.findByUsernameIgnoreCase(username);

                UserRole role;
                String fullName;
                String region = null;

                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    if (!user.getActive()) {
                        log.warn("User {} is inactive", username);
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "User account is inactive");
                        return;
                    }
                    role = user.getRole();
                    fullName = user.getFullName();
                    region = user.getRegion();
                    log.info("User {} authenticated with role: {}", username, role);
                } else {
                    // User not in database - grant read-only access
                    role = UserRole.READ_ONLY;
                    fullName = username;
                    log.info("User {} not found in database, granting READ_ONLY access", username);
                }

                // Create authentication token
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name())));
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.error("Error processing LDAP authentication", e);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract username from request headers.
     * Priority order:
     * 1. X-Authenticated-User (custom header from BAM/proxy)
     * 2. REMOTE_USER (standard Windows auth header)
     * 3. X-Remote-User (alternative header)
     */
    private String extractUsername(HttpServletRequest request) {
        String username = request.getHeader("X-Authenticated-User");
        if (username == null || username.isEmpty()) {
            username = request.getRemoteUser();
        }
        if (username == null || username.isEmpty()) {
            username = request.getHeader("X-Remote-User");
        }

        // Clean up domain prefix if present (e.g., DOMAIN\\username -> username)
        if (username != null && username.contains("\\\\")) {
            username = username.substring(username.lastIndexOf("\\\\") + 1);
        }

        return username;
    }
}
