package com.enterprise.fast.controller;

import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.dto.response.AuthResponse;
import com.enterprise.fast.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for user-related operations
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User information endpoints")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user information")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // Get role from authorities
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .orElse("READ_ONLY");

        // Try to get full user details from database
        User user = userRepository.findByUsername(username).orElse(null);

        AuthResponse response;
        if (user != null) {
            response = AuthResponse.builder()
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .region(user.getRegion())
                    .build();
        } else {
            // User not in database - return minimal info
            response = AuthResponse.builder()
                    .username(username)
                    .fullName(username)
                    .role(role)
                    .region(null)
                    .build();
        }

        return ResponseEntity.ok(response);
    }
}
