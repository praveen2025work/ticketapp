package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.AuditLog;
import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.AuditLogRepository;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final FastProblemRepository fastProblemRepository;

    @Override
    @Transactional
    public void logAction(Long problemId, String action, String performedBy,
                          String fieldChanged, String oldValue, String newValue) {
        FastProblem problem = fastProblemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("FastProblem", "id", problemId));

        AuditLog log = AuditLog.builder()
                .fastProblem(problem)
                .action(action)
                .performedBy(performedBy)
                .fieldChanged(fieldChanged)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();

        auditLogRepository.save(log);
    }

    @Override
    public List<AuditLog> getAuditTrail(Long problemId) {
        return auditLogRepository.findByFastProblemIdOrderByTimestampDesc(problemId);
    }

    @Override
    public List<AuditLog> getRecentAuditEntries(int limit) {
        return auditLogRepository.findAllByOrderByTimestampDesc(PageRequest.of(0, limit)).getContent();
    }
}
