package com.enterprise.fast.service;

import com.enterprise.fast.domain.entity.ApprovalRecord;
import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.ApprovalDecision;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.domain.enums.UserRole;
import com.enterprise.fast.dto.request.ApprovalRequest;
import com.enterprise.fast.dto.response.ApprovalResponse;
import com.enterprise.fast.mapper.FastProblemMapper;
import com.enterprise.fast.repository.ApprovalRecordRepository;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.UserRepository;
import com.enterprise.fast.service.impl.ApprovalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApprovalServiceImplTest {

    @Mock
    private ApprovalRecordRepository approvalRepository;

    @Mock
    private FastProblemRepository problemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FastProblemMapper mapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ApprovalServiceImpl service;

    private FastProblem problem;
    private ApprovalRecord record;
    private User reviewer;

    @BeforeEach
    void setUp() {
        problem = FastProblem.builder()
                .id(1L)
                .title("Payment issue")
                .status(TicketStatus.BACKLOG)
                .createdBy("admin")
                .deleted(false)
                .build();

        record = ApprovalRecord.builder()
                .id(100L)
                .fastProblem(problem)
                .approvalRole(UserRole.REVIEWER)
                .decision(ApprovalDecision.PENDING)
                .build();

        reviewer = User.builder()
                .id(10L)
                .username("reviewer")
                .email("reviewer@enterprise.com")
                .fullName("Reviewer User")
                .role(UserRole.REVIEWER)
                .active(true)
                .build();
    }

    @Test
    void approve_WhenAllApprovalsDone_AutoMovesTicketToAccepted() {
        ApprovalRequest request = new ApprovalRequest("Looks good");
        when(approvalRepository.findById(100L)).thenReturn(Optional.of(record));
        when(userRepository.findByUsernameWithApplicationsIgnoreCase("reviewer")).thenReturn(Optional.of(reviewer));
        when(userRepository.findByUsernameIgnoreCase("reviewer")).thenReturn(Optional.of(reviewer));
        when(approvalRepository.save(any(ApprovalRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(approvalRepository.countByFastProblemIdAndDecision(1L, ApprovalDecision.APPROVED)).thenReturn(3L);
        when(approvalRepository.findByFastProblemId(1L)).thenReturn(List.of(record, ApprovalRecord.builder().build(), ApprovalRecord.builder().build()));
        when(mapper.toApprovalResponse(any(ApprovalRecord.class))).thenReturn(ApprovalResponse.builder().id(100L).fastProblemId(1L).decision("APPROVED").build());

        ApprovalResponse response = service.approve(100L, request, "reviewer");

        assertThat(response).isNotNull();
        verify(problemRepository).save(argThat(p -> p.getStatus() == TicketStatus.ACCEPTED));
        verify(auditLogService).logAction(eq(1L), eq("STATUS_CHANGED"), eq("reviewer"), eq("status"), eq("BACKLOG"), eq("ACCEPTED"));
    }

    @Test
    void approve_WhenNotAllApprovalsDone_DoesNotChangeTicketStatus() {
        ApprovalRequest request = new ApprovalRequest("Looks good");
        when(approvalRepository.findById(100L)).thenReturn(Optional.of(record));
        when(userRepository.findByUsernameWithApplicationsIgnoreCase("reviewer")).thenReturn(Optional.of(reviewer));
        when(userRepository.findByUsernameIgnoreCase("reviewer")).thenReturn(Optional.of(reviewer));
        when(approvalRepository.save(any(ApprovalRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(approvalRepository.countByFastProblemIdAndDecision(1L, ApprovalDecision.APPROVED)).thenReturn(2L);
        when(approvalRepository.findByFastProblemId(1L)).thenReturn(List.of(record, ApprovalRecord.builder().build(), ApprovalRecord.builder().build()));
        when(mapper.toApprovalResponse(any(ApprovalRecord.class))).thenReturn(ApprovalResponse.builder().id(100L).fastProblemId(1L).decision("APPROVED").build());

        ApprovalResponse response = service.approve(100L, request, "reviewer");

        assertThat(response).isNotNull();
        verify(problemRepository, never()).save(any(FastProblem.class));
    }
}
