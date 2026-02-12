package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.ApprovalRequest;
import com.enterprise.fast.dto.response.ApprovalResponse;
import com.enterprise.fast.service.ApprovalService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApprovalControllerTest {

    @Mock
    private ApprovalService approvalService;

    @InjectMocks
    private ApprovalController controller;

    private static Authentication auth(String name) {
        return new UsernamePasswordAuthenticationToken(name, null, List.of());
    }

    private static ApprovalResponse approvalResponse(Long id, Long problemId) {
        return ApprovalResponse.builder()
                .id(id)
                .fastProblemId(problemId)
                .approvalRole("REVIEWER")
                .reviewerName("reviewer")
                .decision("PENDING")
                .createdDate(LocalDateTime.now())
                .build();
    }

    @Test
    void submitForApproval_Returns201() {
        when(approvalService.submitForApproval(1L, "user1")).thenReturn(List.of(approvalResponse(1L, 1L)));
        ResponseEntity<List<ApprovalResponse>> res = controller.submitForApproval(1L, auth("user1"));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).hasSize(1);
        assertThat(res.getBody().get(0).getFastProblemId()).isEqualTo(1L);
        verify(approvalService).submitForApproval(1L, "user1");
    }

    @Test
    void getPendingApprovals_ReturnsOk() {
        when(approvalService.getPendingApprovals("reviewer")).thenReturn(List.of(approvalResponse(1L, 1L)));
        ResponseEntity<List<ApprovalResponse>> res = controller.getPendingApprovals(auth("reviewer"));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
        verify(approvalService).getPendingApprovals("reviewer");
    }

    @Test
    void approve_WithBody_ReturnsOk() {
        when(approvalService.approve(eq(1L), any(ApprovalRequest.class), eq("reviewer"))).thenReturn(approvalResponse(1L, 1L));
        ResponseEntity<ApprovalResponse> res = controller.approve(1L, new ApprovalRequest(), auth("reviewer"));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(approvalService).approve(eq(1L), any(ApprovalRequest.class), eq("reviewer"));
    }

    @Test
    void approve_WithNullBody_DefaultsRequest() {
        when(approvalService.approve(eq(1L), any(ApprovalRequest.class), eq("reviewer"))).thenReturn(approvalResponse(1L, 1L));
        ResponseEntity<ApprovalResponse> res = controller.approve(1L, null, auth("reviewer"));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(approvalService).approve(eq(1L), any(ApprovalRequest.class), eq("reviewer"));
    }

    @Test
    void reject_ReturnsOk() {
        when(approvalService.reject(eq(1L), any(ApprovalRequest.class), eq("reviewer"))).thenReturn(approvalResponse(1L, 1L));
        ResponseEntity<ApprovalResponse> res = controller.reject(1L, null, auth("reviewer"));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(approvalService).reject(eq(1L), any(ApprovalRequest.class), eq("reviewer"));
    }

    @Test
    void getApprovalHistory_ReturnsOk() {
        when(approvalService.getApprovalHistory(1L)).thenReturn(List.of(approvalResponse(1L, 1L)));
        ResponseEntity<List<ApprovalResponse>> res = controller.getApprovalHistory(1L);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
        verify(approvalService).getApprovalHistory(1L);
    }
}
