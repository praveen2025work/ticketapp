package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.ApprovalRequest;
import com.enterprise.fast.dto.response.ApprovalResponse;
import com.enterprise.fast.service.ApprovalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/approvals")
@RequiredArgsConstructor
@Tag(name = "Approvals", description = "Approval workflow endpoints")
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping("/problems/{problemId}/submit")
    @Operation(summary = "Submit a problem ticket for approval")
    public ResponseEntity<List<ApprovalResponse>> submitForApproval(
            @PathVariable Long problemId,
            Authentication authentication) {
        List<ApprovalResponse> responses = approvalService.submitForApproval(problemId, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending approvals for the current reviewer")
    public ResponseEntity<List<ApprovalResponse>> getPendingApprovals(Authentication authentication) {
        return ResponseEntity.ok(approvalService.getPendingApprovals(authentication.getName()));
    }

    @PutMapping("/{approvalId}/approve")
    @Operation(summary = "Approve a problem ticket")
    public ResponseEntity<ApprovalResponse> approve(
            @PathVariable Long approvalId,
            @RequestBody(required = false) ApprovalRequest request,
            Authentication authentication) {
        if (request == null) request = new ApprovalRequest();
        return ResponseEntity.ok(approvalService.approve(approvalId, request, authentication.getName()));
    }

    @PutMapping("/{approvalId}/reject")
    @Operation(summary = "Reject a problem ticket")
    public ResponseEntity<ApprovalResponse> reject(
            @PathVariable Long approvalId,
            @RequestBody(required = false) ApprovalRequest request,
            Authentication authentication) {
        if (request == null) request = new ApprovalRequest();
        return ResponseEntity.ok(approvalService.reject(approvalId, request, authentication.getName()));
    }

    @GetMapping("/problems/{problemId}/history")
    @Operation(summary = "Get approval history for a problem")
    public ResponseEntity<List<ApprovalResponse>> getApprovalHistory(@PathVariable Long problemId) {
        return ResponseEntity.ok(approvalService.getApprovalHistory(problemId));
    }
}
