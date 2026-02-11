package com.enterprise.fast.service;

import com.enterprise.fast.domain.entity.AuditLog;

import java.util.List;

public interface AuditLogService {

    void logAction(Long problemId, String action, String performedBy,
                   String fieldChanged, String oldValue, String newValue);

    List<AuditLog> getAuditTrail(Long problemId);

    List<AuditLog> getRecentAuditEntries(int limit);
}
