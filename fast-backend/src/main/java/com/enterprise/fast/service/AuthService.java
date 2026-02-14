package com.enterprise.fast.service;

import com.enterprise.fast.dto.request.LoginRequest;
import com.enterprise.fast.dto.request.RegisterRequest;
import com.enterprise.fast.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    /**
     * Login with username resolved from AD (prod/dev/prod-h2).
     * Lookup user in users table; if found and active return JWT, else grant READ_ONLY.
     */
    AuthResponse login(LoginRequest request);
}
