package com.enterprise.fast.controller;

import com.enterprise.fast.domain.entity.AuditLog;
import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogControllerTest {

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AuditLogController controller;

    @Test
    void getAuditTrail_ReturnsOk() {
        FastProblem problem = FastProblem.builder().id(1L).build();
        AuditLog log = AuditLog.builder()
                .id(1L)
                .fastProblem(problem)
                .action("CREATED")
                .performedBy("user1")
                .fieldChanged("status")
                .oldValue("NEW")
                .newValue("ASSIGNED")
                .timestamp(LocalDateTime.now())
                .build();
        when(auditLogService.getAuditTrail(1L)).thenReturn(List.of(log));
        ResponseEntity<List<Map<String, Object>>> res = controller.getAuditTrail(1L);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody()).hasSize(1);
        assertThat(res.getBody().get(0).get("action")).isEqualTo("CREATED");
        assertThat(res.getBody().get(0).get("problemId")).isIn(1, 1L);
        verify(auditLogService).getAuditTrail(1L);
    }

    @Test
    void getRecentEntries_WithDefaultLimit_ReturnsOk() {
        when(auditLogService.getRecentAuditEntries(50)).thenReturn(List.of());
        ResponseEntity<List<Map<String, Object>>> res = controller.getRecentEntries(50);
        assertThat(res.getBody()).isEmpty();
        verify(auditLogService).getRecentAuditEntries(50);
    }

    @Test
    void getRecentEntries_WithCustomLimit_ReturnsOk() {
        when(auditLogService.getRecentAuditEntries(20)).thenReturn(List.of());
        ResponseEntity<List<Map<String, Object>>> res = controller.getRecentEntries(20);
        verify(auditLogService).getRecentAuditEntries(20);
    }
}
