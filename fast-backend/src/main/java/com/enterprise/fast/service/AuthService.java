package com.enterprise.fast.service;

import com.enterprise.fast.dto.request.RegisterRequest;
import com.enterprise.fast.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);
}
