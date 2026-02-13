package com.enterprise.fast.exception;

import com.enterprise.fast.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        log.warn("404 NOT_FOUND path={} message={}", path, ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(build(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), path, null));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoHandlerFound(
            NoHandlerFoundException ex, HttpServletRequest request) {
        String path = ex.getRequestURL();
        log.warn("404 NOT_FOUND path={} method={}", path, ex.getHttpMethod());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(build(HttpStatus.NOT_FOUND, "NOT_FOUND", "No endpoint for " + ex.getHttpMethod() + " " + path, path, null));
    }

    @ExceptionHandler(InvalidStateTransitionException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidStateTransition(
            InvalidStateTransitionException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        log.warn("400 INVALID_STATE path={} message={}", path, ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(build(HttpStatus.BAD_REQUEST, "INVALID_STATE", ex.getMessage(), path, null));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        log.warn("400 BAD_REQUEST path={} message={}", path, ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), path, null));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalState(
            IllegalStateException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        log.warn("400 BAD_REQUEST path={} message={}", path, ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), path, null));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        log.warn("403 FORBIDDEN path={} message={}", path, ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(build(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied", path, null));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        String message = ex.getCause() != null && ex.getCause().getMessage() != null
                ? ex.getCause().getMessage()
                : ex.getMessage();
        if (message != null && (message.contains("Unique") || message.contains("unique"))) {
            message = "Duplicate value not allowed; the record may already exist.";
        } else if (message == null) {
            message = "Data constraint violation";
        }
        log.warn("400 DATA_INTEGRITY path={} message={}", path, message);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(build(HttpStatus.BAD_REQUEST, "DATA_INTEGRITY", message, path, null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        Map<String, String> details = ex.getBindingResult().getAllErrors().stream()
                .filter(error -> error instanceof FieldError)
                .collect(Collectors.toMap(
                        error -> ((FieldError) error).getField(),
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid",
                        (a, b) -> a));
        log.warn("400 VALIDATION_FAILED path={} fields={}", path, details.keySet());
        ApiErrorResponse body = ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                "Validation failed for one or more fields",
                "VALIDATION_FAILED",
                path,
                details);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        log.error("500 INTERNAL_ERROR path={} error={}", path, ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                        "An unexpected error occurred. Please try again or contact support.", path, null));
    }

    private static ApiErrorResponse build(HttpStatus status, String code, String message, String path, Map<String, String> details) {
        return ApiErrorResponse.of(status.value(), status.getReasonPhrase(), message, code, path, details);
    }
}
