package com.enterprise.fast.controller;

import com.enterprise.fast.domain.entity.Application;
import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.dto.response.ApplicationResponse;
import com.enterprise.fast.dto.response.AuthResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.dto.response.UserResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.ApplicationRepository;
import com.enterprise.fast.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.enterprise.fast.domain.enums.UserRole;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for user-related operations
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User information endpoints")
public class UserController {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    private UserResponse toUserResponse(User u) {
        List<ApplicationResponse> apps = u.getApplications() != null ? u.getApplications().stream()
                .map(a -> ApplicationResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .code(a.getCode())
                        .description(a.getDescription())
                        .createdDate(a.getCreatedDate())
                        .updatedDate(a.getUpdatedDate())
                        .build())
                .collect(Collectors.toList()) : List.of();
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .role(u.getRole() != null ? u.getRole().name() : null)
                .region(u.getRegion())
                .active(u.getActive())
                .createdDate(u.getCreatedDate())
                .applications(apps)
                .build();
    }

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "List all users (Admin only, paginated)")
    public ResponseEntity<PagedResponse<UserResponse>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<User> userPage = userRepository.findAllWithApplications(PageRequest.of(page, size));
        PagedResponse<UserResponse> response = PagedResponse.<UserResponse>builder()
                .content(userPage.getContent().stream()
                        .map(this::toUserResponse)
                        .toList())
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tech-leads")
    @Transactional(readOnly = true)
    @Operation(summary = "List TECH_LEAD users (for BTB Tech Lead assignment)")
    public ResponseEntity<List<UserResponse>> listTechLeads() {
        List<User> techLeads = userRepository.findByRoleInAndActiveTrue(Collections.singletonList(UserRole.TECH_LEAD));
        return ResponseEntity.ok(techLeads.stream().map(this::toUserResponse).toList());
    }

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

    @PutMapping("/{id}/applications")
    @Operation(summary = "Update user's linked applications (Admin only)")
    @Transactional
    public ResponseEntity<UserResponse> updateUserApplications(
            @PathVariable Long id,
            @RequestBody List<Long> applicationIds) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        List<Application> applications = applicationIds != null && !applicationIds.isEmpty()
                ? applicationRepository.findAllById(applicationIds)
                : List.of();
        user.getApplications().clear();
        user.getApplications().addAll(applications);
        userRepository.save(user);
        return ResponseEntity.ok(toUserResponse(user));
    }
}
