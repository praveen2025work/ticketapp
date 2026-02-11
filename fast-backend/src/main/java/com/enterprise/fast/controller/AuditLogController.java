package com.enterprise.fast.controller;

import com.enterprise.fast.domain.entity.AuditLog;
import com.enterprise.fast.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Audit trail endpoints")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/problem/{problemId}")
    @Operation(summary = "Get audit trail for a specific problem ticket")
    public ResponseEntity<List<Map<String, Object>>> getAuditTrail(@PathVariable Long problemId) {
        List<AuditLog> logs = auditLogService.getAuditTrail(problemId);
        return ResponseEntity.ok(logs.stream().map(this::toMap).collect(Collectors.toList()));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent audit entries (Admin only)")
    public ResponseEntity<List<Map<String, Object>>> getRecentEntries(
            @RequestParam(defaultValue = "50") int limit) {
        List<AuditLog> logs = auditLogService.getRecentAuditEntries(limit);
        return ResponseEntity.ok(logs.stream().map(this::toMap).collect(Collectors.toList()));
    }

    private Map<String, Object> toMap(AuditLog log) {
        return Map.of(
                "id", log.getId(),
                "problemId", log.getFastProblem().getId(),
                "action", log.getAction(),
                "performedBy", log.getPerformedBy(),
                "fieldChanged", log.getFieldChanged() != null ? log.getFieldChanged() : "",
                "oldValue", log.getOldValue() != null ? log.getOldValue() : "",
                "newValue", log.getNewValue() != null ? log.getNewValue() : "",
                "timestamp", log.getTimestamp().toString()
        );
    }
}
