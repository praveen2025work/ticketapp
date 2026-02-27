package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.UserGroupRequest;
import com.enterprise.fast.dto.response.UserGroupResponse;
import com.enterprise.fast.service.UserGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user-groups")
@RequiredArgsConstructor
@Tag(name = "User Groups", description = "Impacted user group master data")
public class UserGroupController {

    private final UserGroupService service;

    @GetMapping
    @Operation(summary = "List user groups (activeOnly defaults to true)")
    public ResponseEntity<List<UserGroupResponse>> list(
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(service.findAll(activeOnly));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user group by id")
    public ResponseEntity<UserGroupResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create user group (Admin only)")
    public ResponseEntity<UserGroupResponse> create(@Valid @RequestBody UserGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user group (Admin only)")
    public ResponseEntity<UserGroupResponse> update(@PathVariable Long id, @Valid @RequestBody UserGroupRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate user group (Admin only)")
    public ResponseEntity<UserGroupResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(service.deactivate(id));
    }
}
