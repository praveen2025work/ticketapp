package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.ApplicationRequest;
import com.enterprise.fast.dto.response.ApplicationResponse;
import com.enterprise.fast.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Application configuration (Admin)")
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    @Operation(summary = "List all applications")
    public ResponseEntity<List<ApplicationResponse>> list() {
        return ResponseEntity.ok(applicationService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get application by id")
    public ResponseEntity<ApplicationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create application (Admin only)")
    public ResponseEntity<ApplicationResponse> create(@Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update application (Admin only)")
    public ResponseEntity<ApplicationResponse> update(@PathVariable Long id, @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(applicationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete application (Admin only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        applicationService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
