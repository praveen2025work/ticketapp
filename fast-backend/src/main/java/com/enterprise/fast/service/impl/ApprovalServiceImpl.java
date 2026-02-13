package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.Application;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
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

        // One approval slot per role; anyone with that role can approve (no link to specific person)
        List<ApprovalRecord> records = List.of(
                ApprovalRecord.builder().fastProblem(problem).approvalRole(UserRole.REVIEWER).build(),
                ApprovalRecord.builder().fastProblem(problem).approvalRole(UserRole.APPROVER).build(),
                ApprovalRecord.builder().fastProblem(problem).approvalRole(UserRole.RTB_OWNER).build()
        );

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

        User user = userRepository.findByUsernameWithApplicationsIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        if (!userCanApproveTicket(user, record.getFastProblem())) {
            throw new AccessDeniedException("You are not associated with any application linked to this ticket");
        }

        record.setDecision(ApprovalDecision.APPROVED);
        record.setComments(request.getComments());
        record.setDecisionDate(LocalDateTime.now());
        record.setReviewerName(username);
        record.setReviewerEmail(userRepository.findByUsernameIgnoreCase(username).map(User::getEmail).orElse(null));

        ApprovalRecord saved = approvalRepository.save(record);

        // Move to ASSIGNED only when ALL approvals (Reviewer, Approver, RTB Owner) are done
        FastProblem problem = record.getFastProblem();
        if (problem.getStatus() == TicketStatus.NEW) {
            long approvedCount = approvalRepository.countByFastProblemIdAndDecision(problem.getId(), ApprovalDecision.APPROVED);
            long totalForProblem = approvalRepository.findByFastProblemId(problem.getId()).size();
            if (approvedCount == totalForProblem && totalForProblem >= 3) {
                problem.setStatus(TicketStatus.ASSIGNED);
                problemRepository.save(problem);
                auditLogService.logAction(problem.getId(), "STATUS_CHANGED", username, "status", "NEW", "ASSIGNED");
            }
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

        User user = userRepository.findByUsernameWithApplicationsIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        if (!userCanApproveTicket(user, record.getFastProblem())) {
            throw new AccessDeniedException("You are not associated with any application linked to this ticket");
        }

        record.setDecision(ApprovalDecision.REJECTED);
        record.setComments(request.getComments());
        record.setDecisionDate(LocalDateTime.now());
        record.setReviewerName(username);
        record.setReviewerEmail(userRepository.findByUsernameIgnoreCase(username).map(User::getEmail).orElse(null));

        ApprovalRecord saved = approvalRepository.save(record);

        // Any one rejection moves the ticket to REJECTED
        FastProblem problem = record.getFastProblem();
        if (problem.getStatus() == TicketStatus.NEW) {
            problem.setStatus(TicketStatus.REJECTED);
            problemRepository.save(problem);
            auditLogService.logAction(problem.getId(), "STATUS_CHANGED", username, "status", "NEW", "REJECTED");
        }

        auditLogService.logAction(problem.getId(), "REJECTED", username, null, null, request.getComments());

        return mapper.toApprovalResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalResponse> getPendingApprovals(String username) {
        User user = userRepository.findByUsernameWithApplicationsIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        List<ApprovalRecord> pending;
        if (user.getRole() == UserRole.ADMIN) {
            pending = approvalRepository.findByDecision(ApprovalDecision.PENDING);
        } else if (user.getRole() == UserRole.REVIEWER || user.getRole() == UserRole.APPROVER || user.getRole() == UserRole.RTB_OWNER) {
            pending = approvalRepository.findByDecisionAndApprovalRoleIn(ApprovalDecision.PENDING, List.of(user.getRole()));
        } else {
            pending = List.of();
        }
        // Filter to only approvals for tickets where user is associated with at least one application
        return pending.stream()
                .filter(r -> userCanApproveTicket(user, r.getFastProblem()))
                .map(mapper::toApprovalResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns true if the user can perform approval on the ticket.
     * ADMIN can approve any ticket. Otherwise, user must be associated with at least one
     * application linked to the ticket (via user_application mapping).
     */
    private boolean userCanApproveTicket(User user, FastProblem problem) {
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }
        List<Application> ticketApps = problem.getApplications();
        if (ticketApps == null || ticketApps.isEmpty()) {
            return true; // no applications on ticket — allow
        }
        List<Application> userApps = user.getApplications();
        if (userApps == null || userApps.isEmpty()) {
            return false;
        }
        Set<Long> ticketAppIds = ticketApps.stream().map(Application::getId).collect(Collectors.toSet());
        return userApps.stream().anyMatch(a -> a.getId() != null && ticketAppIds.contains(a.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalResponse> getApprovalHistory(Long problemId) {
        return approvalRepository.findByFastProblemId(problemId).stream()
                .collect(Collectors.groupingBy(r -> r.getApprovalRole() != null ? r.getApprovalRole() : "LEGACY"))
                .values().stream()
                .map(group -> group.stream().min(Comparator.comparing(ApprovalRecord::getId)).orElseThrow())
                .sorted(Comparator.comparing(ApprovalRecord::getId))
                .map(mapper::toApprovalResponse)
                .collect(Collectors.toList());
    }
}
