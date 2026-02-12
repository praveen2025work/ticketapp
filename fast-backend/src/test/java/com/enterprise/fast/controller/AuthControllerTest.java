package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.RegisterRequest;
import com.enterprise.fast.dto.response.AuthResponse;
import com.enterprise.fast.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController controller;

    @Test
    void register_WithValidRequest_ReturnsOk() {
        RegisterRequest req = new RegisterRequest("newuser", "a@b.com", "Full Name", "READ_ONLY", null);
        AuthResponse response = AuthResponse.builder()
                .username("newuser")
                .fullName("Full Name")
                .role("READ_ONLY")
                .region(null)
                .build();
        when(authService.register(any())).thenReturn(response);
        ResponseEntity<AuthResponse> res = controller.register(req);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody().getUsername()).isEqualTo("newuser");
        verify(authService).register(any());
    }
}
