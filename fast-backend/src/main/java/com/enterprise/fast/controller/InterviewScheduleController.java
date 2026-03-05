package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.InterviewScheduleRequest;
import com.enterprise.fast.dto.response.InterviewScheduleResponse;
import com.enterprise.fast.service.InterviewScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/interview-schedules")
@RequiredArgsConstructor
@Tag(name = "Interview Schedules", description = "Interview schedule sheet capture and timeline data")
public class InterviewScheduleController {

    private final InterviewScheduleService service;

    @GetMapping
    @Operation(summary = "List interview schedules")
    public ResponseEntity<List<InterviewScheduleResponse>> list() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get interview schedule by id")
    public ResponseEntity<InterviewScheduleResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create interview schedule")
    public ResponseEntity<InterviewScheduleResponse> create(
            @Valid @RequestBody InterviewScheduleRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update interview schedule")
    public ResponseEntity<InterviewScheduleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody InterviewScheduleRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(service.update(id, request, authentication.getName()));
    }
}
