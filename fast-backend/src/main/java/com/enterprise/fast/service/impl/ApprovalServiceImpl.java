package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.ApprovalRecord;
import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.ApprovalDecision;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.domain.enums.UserRole;
import com.enterprise.fast.dto.request.ApprovalRequest;
import com.enterprise.fast.dto.response.ApprovalResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.mapper.FastProblemMapper;
import com.enterprise.fast.repository.ApprovalRecordRepository;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.UserRepository;
import com.enterprise.fast.service.ApprovalService;
import com.enterprise.fast.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApprovalServiceImpl implements ApprovalService {

    private final ApprovalRecordRepository approvalRepository;
    private final FastProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final FastProblemMapper mapper;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public List<ApprovalResponse> submitForApproval(Long problemId, String username) {
        FastProblem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("FastProblem", "id", problemId));

        if (problem.getStatus() != TicketStatus.NEW) {
            throw new IllegalArgumentException("Only NEW tickets can be submitted for approval");
        }

        if (!approvalRepository.findByFastProblemId(problemId).isEmpty()) {
            throw new IllegalArgumentException("This ticket has already been submitted for approval");
        }

        // Create approval records for REVIEWER, APPROVER, and RTB_OWNER (parallel approval)
        List<User> reviewers = userRepository.findByRoleInAndActiveTrue(
                List.of(UserRole.REVIEWER, UserRole.APPROVER, UserRole.RTB_OWNER));
        List<ApprovalRecord> records = reviewers.isEmpty()
                ? List.of(ApprovalRecord.builder()
                        .fastProblem(problem)
                        .reviewerName(username)
                        .reviewerEmail(null)
                        .build())
                : reviewers.stream()
                        .map(user -> ApprovalRecord.builder()
                                .fastProblem(problem)
                                .reviewerName(user.getUsername())
                                .reviewerEmail(user.getEmail())
                                .build())
                        .toList();

        List<ApprovalRecord> saved = approvalRepository.saveAll(records);

        auditLogService.logAction(problemId, "SUBMITTED_FOR_APPROVAL", username, null, null, null);

        return saved.stream().map(mapper::toApprovalResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ApprovalResponse approve(Long approvalId, ApprovalRequest request, String username) {
        ApprovalRecord record = approvalRepository.findById(approvalId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRecord", "id", approvalId));

        if (record.getDecision() != ApprovalDecision.PENDING) {
            throw new IllegalArgumentException("This approval has already been decided");
        }

        record.setDecision(ApprovalDecision.APPROVED);
        record.setComments(request.getComments());
        record.setDecisionDate(LocalDateTime.now());

        ApprovalRecord saved = approvalRepository.save(record);

        // If approved, transition problem to ASSIGNED
        FastProblem problem = record.getFastProblem();
        if (problem.getStatus() == TicketStatus.NEW) {
            problem.setStatus(TicketStatus.ASSIGNED);
            problemRepository.save(problem);
            auditLogService.logAction(problem.getId(), "STATUS_CHANGED", username, "status", "NEW", "ASSIGNED");
        }

        auditLogService.logAction(problem.getId(), "APPROVED", username, null, null, null);

        return mapper.toApprovalResponse(saved);
    }

    @Override
    @Transactional
    public ApprovalResponse reject(Long approvalId, ApprovalRequest request, String username) {
        ApprovalRecord record = approvalRepository.findById(approvalId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRecord", "id", approvalId));

        if (record.getDecision() != ApprovalDecision.PENDING) {
            throw new IllegalArgumentException("This approval has already been decided");
        }

        record.setDecision(ApprovalDecision.REJECTED);
        record.setComments(request.getComments());
        record.setDecisionDate(LocalDateTime.now());

        ApprovalRecord saved = approvalRepository.save(record);

        // If all approvals are rejected, reject the problem
        FastProblem problem = record.getFastProblem();
        long pendingCount = approvalRepository.countByFastProblemIdAndDecision(problem.getId(), ApprovalDecision.PENDING);
        long approvedCount = approvalRepository.countByFastProblemIdAndDecision(problem.getId(), ApprovalDecision.APPROVED);

        if (pendingCount == 0 && approvedCount == 0) {
            problem.setStatus(TicketStatus.REJECTED);
            problemRepository.save(problem);
            auditLogService.logAction(problem.getId(), "STATUS_CHANGED", username, "status", "NEW", "REJECTED");
        }

        auditLogService.logAction(problem.getId(), "REJECTED", username, null, null, request.getComments());

        return mapper.toApprovalResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalResponse> getPendingApprovals(String reviewerUsername) {
        return approvalRepository.findByReviewerNameAndDecision(reviewerUsername, ApprovalDecision.PENDING).stream()
                .map(mapper::toApprovalResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalResponse> getApprovalHistory(Long problemId) {
        return approvalRepository.findByFastProblemId(problemId).stream()
                .collect(Collectors.groupingBy(ApprovalRecord::getReviewerName))
                .values().stream()
                .map(group -> group.stream().min(Comparator.comparing(ApprovalRecord::getId)).orElseThrow())
                .sorted(Comparator.comparing(ApprovalRecord::getId))
                .map(mapper::toApprovalResponse)
                .collect(Collectors.toList());
    }
}
