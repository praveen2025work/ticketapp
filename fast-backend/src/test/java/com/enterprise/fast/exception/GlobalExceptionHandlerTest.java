package com.enterprise.fast.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleResourceNotFound_Returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Application", "id", 1L);
        ResponseEntity<Map<String, Object>> res = handler.handleResourceNotFound(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody()).containsKey("message");
        assertThat(res.getBody().get("message")).asString().contains("Application");
    }

    @Test
    void handleInvalidStateTransition_Returns400() {
        InvalidStateTransitionException ex = new InvalidStateTransitionException(
                com.enterprise.fast.domain.enums.TicketStatus.NEW,
                com.enterprise.fast.domain.enums.TicketStatus.RESOLVED);
        ResponseEntity<Map<String, Object>> res = handler.handleInvalidStateTransition(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).containsKey("message");
    }

    @Test
    void handleIllegalArgument_Returns400() {
        IllegalArgumentException ex = new IllegalArgumentException("Bad value");
        ResponseEntity<Map<String, Object>> res = handler.handleIllegalArgument(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody().get("message")).isEqualTo("Bad value");
    }

    @Test
    void handleAccessDenied_Returns403() {
        AccessDeniedException ex = new AccessDeniedException("Denied");
        ResponseEntity<Map<String, Object>> res = handler.handleAccessDenied(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(res.getBody().get("message")).isEqualTo("Access denied");
    }

    @Test
    void handleValidation_Returns400WithDetails() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(
                java.util.List.of(new FieldError("request", "name", "Name is required")));

        ResponseEntity<Map<String, Object>> res = handler.handleValidation(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).containsKey("details");
        @SuppressWarnings("unchecked")
        Map<String, String> details = (Map<String, String>) res.getBody().get("details");
        assertThat(details).containsEntry("name", "Name is required");
    }

    @Test
    void handleGeneric_Returns500() {
        ResponseEntity<Map<String, Object>> res = handler.handleGeneric(new RuntimeException("Unexpected"));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(res.getBody().get("message")).isEqualTo("An unexpected error occurred");
    }
}
