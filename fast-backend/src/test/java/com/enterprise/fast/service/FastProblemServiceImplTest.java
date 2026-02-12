package com.enterprise.fast.service;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.dto.request.CreateFastProblemRequest;
import com.enterprise.fast.dto.request.UpdateFastProblemRequest;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.exception.InvalidStateTransitionException;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.mapper.FastProblemMapper;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.service.impl.FastProblemServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FastProblemServiceImplTest {

    @Mock
    private FastProblemRepository repository;

    @Mock
    private FastProblemMapper mapper;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private KnowledgeArticleService knowledgeArticleService;

    @InjectMocks
    private FastProblemServiceImpl service;

    private FastProblem problem;
    private FastProblemResponse response;

    @BeforeEach
    void setUp() {
        problem = FastProblem.builder()
                .id(1L)
                .title("Test Problem")
                .classification(Classification.A)
                .status(TicketStatus.NEW)
                .deleted(false)
                .build();
        problem.getRegions().add(com.enterprise.fast.domain.entity.FastProblemRegion.builder()
                .fastProblem(problem).regionalCode(RegionalCode.AMER).build());
        response = FastProblemResponse.builder()
                .id(1L)
                .title("Test Problem")
                .classification("A")
                .regionalCodes(List.of("AMER"))
                .status("NEW")
                .build();
    }

    @Test
    void getById_WhenExists_ReturnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(problem));
        when(mapper.toResponse(problem)).thenReturn(response);

        FastProblemResponse result = service.getById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Test Problem");
    }

    @Test
    void getById_WhenNotExists_ThrowsResourceNotFoundException() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAll_ReturnsPagedResponse() {
        Page<FastProblem> page = new PageImpl<>(List.of(problem));
        when(repository.findByDeletedFalse(any(Pageable.class))).thenReturn(page);
        when(mapper.toSummaryResponse(any())).thenReturn(response);

        PagedResponse<FastProblemResponse> result = service.getAll(0, 20, "createdDate", "desc");

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Problem");
    }

    @Test
    void updateStatus_WithValidTransition_Succeeds() {
        when(repository.findById(1L)).thenReturn(Optional.of(problem));
        when(repository.save(any())).thenReturn(problem);
        when(mapper.toResponse(any())).thenReturn(response);

        FastProblemResponse result = service.updateStatus(1L, "ASSIGNED", "admin");

        assertThat(result).isNotNull();
        verify(auditLogService).logAction(eq(1L), eq("STATUS_CHANGED"), eq("admin"), eq("status"), eq("NEW"), eq("ASSIGNED"));
    }

    @Test
    void updateStatus_WithInvalidTransition_ThrowsException() {
        when(repository.findById(1L)).thenReturn(Optional.of(problem));

        assertThatThrownBy(() -> service.updateStatus(1L, "RESOLVED", "admin"))
                .isInstanceOf(InvalidStateTransitionException.class);
        verify(repository, never()).save(any());
    }
}
