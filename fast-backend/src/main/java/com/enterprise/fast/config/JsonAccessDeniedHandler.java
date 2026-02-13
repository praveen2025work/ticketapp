package com.enterprise.fast.config;

import com.enterprise.fast.dto.response.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns 403 as JSON (same shape as GlobalExceptionHandler) so the frontend
 * can identify authorization errors consistently. Logs every 403.
 */
@Component
@Slf4j
public class JsonAccessDeniedHandler implements AccessDeniedHandler {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                      AccessDeniedException accessDeniedException) throws IOException {
        String path = request.getRequestURI();
        log.warn("403 FORBIDDEN path={} message={}", path, accessDeniedException.getMessage());
        ApiErrorResponse body = ApiErrorResponse.of(
                403,
                "Forbidden",
                "Access denied. You do not have permission for this action.",
                "FORBIDDEN",
                path,
                null);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        OBJECT_MAPPER.writeValue(response.getOutputStream(), body);
    }
}
