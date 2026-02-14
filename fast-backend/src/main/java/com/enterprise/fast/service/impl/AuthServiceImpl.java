package com.enterprise.fast.service.impl;

import com.enterprise.fast.config.JwtUtil;
import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.UserRole;
import com.enterprise.fast.dto.request.LoginRequest;
import com.enterprise.fast.dto.request.RegisterRequest;
import com.enterprise.fast.dto.response.AuthResponse;
import com.enterprise.fast.repository.UserRepository;
import com.enterprise.fast.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim().toLowerCase() : "";
        if (username.isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .username(username)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .role(UserRole.valueOf(request.getRole()))
                .region(request.getRegion())
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .region(user.getRegion())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String raw = request.getUsername() != null ? request.getUsername().trim() : "";
        if (raw.isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        String username = raw.contains("\\") ? raw.substring(raw.lastIndexOf("\\") + 1) : raw;

        return userRepository.findByUsernameIgnoreCase(username)
                .filter(User::getActive)
                .map(user -> AuthResponse.builder()
                        .token(jwtUtil.generateToken(user.getUsername(), user.getRole().name()))
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .role(user.getRole().name())
                        .region(user.getRegion())
                        .build())
                .orElseGet(() -> AuthResponse.builder()
                        .token(jwtUtil.generateToken(username, UserRole.READ_ONLY.name()))
                        .username(username)
                        .fullName(username)
                        .role(UserRole.READ_ONLY.name())
                        .region(null)
                        .build());
    }
}
