package com.enterprise.fast.config;

import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.UserRole;
import com.enterprise.fast.repository.UserRepository;
import com.enterprise.fast.service.BamService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.Optional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Filter to handle BAM SSO authentication.
 * In local environment: bypasses authentication
 * In dev/prod: validates BAM token and extracts user from Windows AD
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BamAuthenticationFilter extends OncePerRequestFilter {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final UserRepository userRepository;
    private final BamService bamService;

    @Value("${app.auth.mode:local}")
    private String authMode;

    @Value("${app.auth.local.default-user:admin}")
    private String localDefaultUser;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            if (SecurityContextHolder.getContext().getAuthentication() == null) {

                if ("local".equalsIgnoreCase(authMode)) {
                    // LOCAL MODE: Auto-authenticate with default user
                    authenticateLocalUser(request);
                } else {
                    // BAM MODE: Extract user from BAM token or Windows AD
                    authenticateBamUser(request, response);
                }
            }
        } catch (Exception e) {
            log.error("Error processing authentication", e);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Local development mode: Auto-authenticate with configured user
     */
    private void authenticateLocalUser(HttpServletRequest request) {
        // Check if dev user switcher is active
        String devUser = request.getHeader("X-Authenticated-User");
        String username = devUser != null ? devUser : localDefaultUser;

        log.debug("LOCAL MODE: Auto-authenticating user: {}", username);

        Optional<User> userOptional = userRepository.findByUsername(username);
        UserRole role;
        String fullName;
        String region = null;

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            role = user.getRole();
            fullName = user.getFullName();
            region = user.getRegion();
        } else {
            role = UserRole.READ_ONLY;
            fullName = username;
        }

        setAuthentication(request, username, role);
    }

    /**
     * BAM SSO mode: Extract user from BAM token and Windows AD
     */
    private void authenticateBamUser(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Extract BAM token from Authorization header
        String bamToken = extractBamToken(request);

        if (bamToken == null) {
            log.warn("No BAM token found in request");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "BAM token required");
            return;
        }

        if (!bamService.validateBamToken(bamToken)) {
            log.warn("Invalid BAM token");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid BAM token");
            return;
        }

        // Prefer username from JWT payload, then headers
        String username = extractUsernameFromBamToken(bamToken);
        if (username == null || username.isEmpty()) {
            username = request.getHeader("X-User-Name");
        }
        if (username == null || username.isEmpty()) {
            username = request.getRemoteUser();
        }

        if (username == null || username.isEmpty()) {
            log.warn("No username found in BAM request or token");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "User identity required");
            return;
        }

        // Clean up domain prefix if present (e.g., DOMAIN\\username -> username)
        if (username.contains("\\\\")) {
            username = username.substring(username.lastIndexOf("\\\\") + 1);
        }

        log.info("BAM MODE: Authenticating user: {}", username);

        // Look up user in database
        Optional<User> userOptional = userRepository.findByUsername(username);
        UserRole role;

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (!user.getActive()) {
                log.warn("User {} is inactive", username);
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "User account is inactive");
                return;
            }
            role = user.getRole();
            log.info("User {} authenticated with role: {}", username, role);
        } else {
            // User not in database - grant read-only access
            role = UserRole.READ_ONLY;
            log.info("User {} not found in database, granting READ_ONLY access", username);
        }

        setAuthentication(request, username, role);
    }

    /**
     * Extract BAM token from Authorization header
     */
    private String extractBamToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    /**
     * Decode BAM JWT payload (no signature verification) and extract username claim.
     * Tries sub, userName, preferred_username.
     */
    private String extractUsernameFromBamToken(String bamToken) {
        try {
            String[] parts = bamToken.split("\\.");
            if (parts.length < 2) return null;
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            JsonNode node = OBJECT_MAPPER.readTree(payload);
            if (node.has("sub") && !node.get("sub").isNull()) return node.get("sub").asText();
            if (node.has("userName") && !node.get("userName").isNull()) return node.get("userName").asText();
            if (node.has("preferred_username") && !node.get("preferred_username").isNull()) return node.get("preferred_username").asText();
            return null;
        } catch (Exception e) {
            log.debug("Could not decode BAM token payload for username", e);
            return null;
        }
    }

    /**
     * Set Spring Security authentication context
     */
    private void setAuthentication(HttpServletRequest request, String username, UserRole role) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                username,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name())));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
