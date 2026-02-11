package com.enterprise.fast.service;

import com.enterprise.fast.dto.request.ApprovalRequest;
import com.enterprise.fast.dto.response.ApprovalResponse;

import java.util.List;

public interface ApprovalService {

    List<ApprovalResponse> submitForApproval(Long problemId, String username);

    ApprovalResponse approve(Long approvalId, ApprovalRequest request, String username);

    ApprovalResponse reject(Long approvalId, ApprovalRequest request, String username);

    List<ApprovalResponse> getPendingApprovals(String reviewerName);

    List<ApprovalResponse> getApprovalHistory(Long problemId);
}
