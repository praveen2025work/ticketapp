package com.enterprise.fast.config;

import com.enterprise.fast.dto.response.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns 401 as JSON (same shape as GlobalExceptionHandler) so the frontend
 * can identify authentication errors consistently. Logs every 401.
 */
@Component
@Slf4j
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        String path = request.getRequestURI();
        log.warn("401 UNAUTHORIZED path={} message={}", path, authException.getMessage());
        ApiErrorResponse body = ApiErrorResponse.of(
                401,
                "Unauthorized",
                "Authentication required. Please sign in.",
                "UNAUTHORIZED",
                path,
                null);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        OBJECT_MAPPER.writeValue(response.getOutputStream(), body);
    }
}
