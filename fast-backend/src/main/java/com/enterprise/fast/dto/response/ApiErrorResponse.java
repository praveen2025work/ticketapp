package com.enterprise.fast.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.Map;

/**
 * Standard error body returned to the frontend for all API errors (401, 403, 404, 500, etc.).
 * Frontend uses status, message, error, code, and details for issue identification.
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    String timestamp;
    int status;
    String error;
    String message;
    /** Machine-readable code for frontend (e.g. NOT_FOUND, UNAUTHORIZED, VALIDATION_FAILED). */
    String code;
    /** Request path that caused the error. */
    String path;
    /** Field-level validation errors (for 400 validation). */
    Map<String, String> details;

    public static ApiErrorResponse of(int status, String error, String message, String code, String path, Map<String, String> details) {
        return ApiErrorResponse.builder()
                .timestamp(Instant.now().toString())
                .status(status)
                .error(error)
                .message(message)
                .code(code)
                .path(path)
                .details(details)
                .build();
    }
}
