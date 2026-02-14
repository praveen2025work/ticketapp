package com.enterprise.fast.config;

import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.UserRole;
import com.enterprise.fast.dto.response.ApiErrorResponse;
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
 * Filter to handle authentication by mode.
 * - local: X-Authenticated-User header, dev user switcher
 * - ad: Frontend calls AD, POST /auth/login, JwtAuthFilter handles Bearer tokens (prod/dev/prod-h2)
 * - bam: BAM SSO token, extracts user from Windows AD
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
                    authenticateLocalUser(request);
                } else if ("ad".equalsIgnoreCase(authMode)) {
                    // AD mode: frontend calls AD, POST /auth/login, JwtAuthFilter handles Bearer tokens
                    // Do nothing here
                } else {
                    // BAM MODE: if we send 401/403, do not continue the chain
                    if (authenticateBamUser(request, response)) {
                        return;
                    }
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

        Optional<User> userOptional = userRepository.findByUsernameIgnoreCase(username);
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
     * BAM SSO mode: Extract user from BAM token and Windows AD.
     * @return true if an error response was written (401/403), so the filter chain should not continue
     */
    private boolean authenticateBamUser(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String path = request.getRequestURI();
        String bamToken = extractBamToken(request);

        if (bamToken == null) {
            log.warn("401 UNAUTHORIZED path={} message=BAM token required", path);
            writeJsonError(response, path, HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED", "BAM token required");
            return true;
        }

        if (!bamService.validateBamToken(bamToken)) {
            log.warn("401 UNAUTHORIZED path={} message=Invalid BAM token", path);
            writeJsonError(response, path, HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED", "Invalid BAM token");
            return true;
        }

        String username = extractUsernameFromBamToken(bamToken);
        if (username == null || username.isEmpty()) {
            username = request.getHeader("X-User-Name");
        }
        if (username == null || username.isEmpty()) {
            username = request.getRemoteUser();
        }

        if (username == null || username.isEmpty()) {
            log.warn("401 UNAUTHORIZED path={} message=User identity required", path);
            writeJsonError(response, path, HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED", "User identity required");
            return true;
        }

        if (username.contains("\\\\")) {
            username = username.substring(username.lastIndexOf("\\\\") + 1);
        }

        log.info("BAM MODE: Authenticating user: {}", username);

        Optional<User> userOptional = userRepository.findByUsernameIgnoreCase(username);
        UserRole role;

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (!user.getActive()) {
                log.warn("403 FORBIDDEN path={} message=User account is inactive user={}", path, username);
                writeJsonError(response, path, HttpServletResponse.SC_FORBIDDEN, "FORBIDDEN", "User account is inactive");
                return true;
            }
            role = user.getRole();
            log.info("User {} authenticated with role: {}", username, role);
        } else {
            role = UserRole.READ_ONLY;
            log.info("User {} not found in database, granting READ_ONLY access", username);
        }

        setAuthentication(request, username, role);
        return false;
    }

    private void writeJsonError(HttpServletResponse response, String path, int status, String code, String message) throws IOException {
        ApiErrorResponse body = ApiErrorResponse.of(status, status == 401 ? "Unauthorized" : "Forbidden", message, code, path, null);
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        OBJECT_MAPPER.writeValue(response.getOutputStream(), body);
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
