package com.enterprise.fast.exception;

import com.enterprise.fast.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/test");
    }

    @Test
    void handleResourceNotFound_Returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Application", "id", 1L);
        ResponseEntity<ApiErrorResponse> res = handler.handleResourceNotFound(ex, request);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getMessage()).contains("Application");
        assertThat(res.getBody().getStatus()).isEqualTo(404);
    }

    @Test
    void handleInvalidStateTransition_Returns400() {
        InvalidStateTransitionException ex = new InvalidStateTransitionException(
                com.enterprise.fast.domain.enums.TicketStatus.NEW,
                com.enterprise.fast.domain.enums.TicketStatus.RESOLVED);
        ResponseEntity<ApiErrorResponse> res = handler.handleInvalidStateTransition(ex, request);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getMessage()).isNotEmpty();
    }

    @Test
    void handleIllegalArgument_Returns400() {
        IllegalArgumentException ex = new IllegalArgumentException("Bad value");
        ResponseEntity<ApiErrorResponse> res = handler.handleIllegalArgument(ex, request);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getMessage()).isEqualTo("Bad value");
    }

    @Test
    void handleAccessDenied_Returns403() {
        AccessDeniedException ex = new AccessDeniedException("Denied");
        ResponseEntity<ApiErrorResponse> res = handler.handleAccessDenied(ex, request);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getMessage()).isEqualTo("Access denied");
    }

    @Test
    void handleValidation_Returns400WithDetails() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(
                java.util.List.of(new FieldError("request", "name", "Name is required")));

        ResponseEntity<ApiErrorResponse> res = handler.handleValidation(ex, request);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getDetails()).containsEntry("name", "Name is required");
    }

    @Test
    void handleGeneric_Returns500() {
        ResponseEntity<ApiErrorResponse> res = handler.handleGeneric(new RuntimeException("Unexpected"), request);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getMessage()).contains("unexpected error");
    }
}
