package com.enterprise.fast.service;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.entity.UserGroup;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.domain.enums.UserRole;
import com.enterprise.fast.dto.request.CreateFastProblemRequest;
import com.enterprise.fast.dto.response.AppSettingsResponse;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.exception.InvalidStateTransitionException;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.mapper.FastProblemMapper;
import com.enterprise.fast.repository.ApplicationRepository;
import com.enterprise.fast.repository.FastProblemLinkRepository;
import com.enterprise.fast.repository.FastProblemPropertyRepository;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.UserGroupRepository;
import com.enterprise.fast.repository.UserRepository;
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
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FastProblemServiceImplTest {

    @Mock
    private FastProblemRepository repository;

    @Mock
    private FastProblemPropertyRepository propertyRepository;

    @Mock
    private FastProblemLinkRepository linkRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private UserGroupRepository userGroupRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AppSettingsService appSettingsService;

    @Mock
    private EmailService emailService;

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
                .status(TicketStatus.BACKLOG)
                .deleted(false)
                .build();
        problem.getRegions().add(com.enterprise.fast.domain.entity.FastProblemRegion.builder()
                .fastProblem(problem).regionalCode(RegionalCode.AMER).build());
        response = FastProblemResponse.builder()
                .id(1L)
                .title("Test Problem")
                .classification("A")
                .regionalCodes(List.of("AMER"))
                .status("BACKLOG")
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
        when(repository.findByDeletedFalseAndArchivedFalse(any(Pageable.class))).thenReturn(page);
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
        verify(auditLogService).logAction(eq(1L), eq("STATUS_CHANGED"), eq("admin"), eq("status"), eq("BACKLOG"), eq("ASSIGNED"));
    }

    @Test
    void updateStatus_WithInvalidTransition_ThrowsException() {
        when(repository.findById(1L)).thenReturn(Optional.of(problem));

        assertThatThrownBy(() -> service.updateStatus(1L, "RESOLVED", "admin"))
                .isInstanceOf(InvalidStateTransitionException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void getByStatus_WhenArchived_UsesSpecAndReturnsPagedResponse() {
        Page<FastProblem> page = new PageImpl<>(List.of(problem));
        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(mapper.toSummaryResponse(any())).thenReturn(response);

        PagedResponse<FastProblemResponse> result = service.getByStatus("ARCHIVED", 0, 20);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Problem");
        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void create_WithInvalidImpactedUserGroupIds_ThrowsBadRequest() {
        CreateFastProblemRequest request = CreateFastProblemRequest.builder()
                .title("Invalid groups")
                .anticipatedBenefits("Benefit")
                .regionalCodes(List.of("AMER"))
                .impactedUserGroupIds(List.of(1L, 99L))
                .build();
        FastProblem toCreate = FastProblem.builder()
                .title("Invalid groups")
                .userImpactCount(0)
                .deleted(false)
                .build();
        toCreate.getRegions().add(com.enterprise.fast.domain.entity.FastProblemRegion.builder()
                .fastProblem(toCreate)
                .regionalCode(RegionalCode.AMER)
                .build());

        when(mapper.toEntity(request, "admin")).thenReturn(toCreate);
        when(userGroupRepository.findAllById(List.of(1L, 99L)))
                .thenReturn(List.of(UserGroup.builder().id(1L).name("Finance Controllers").active(true).build()));

        assertThatThrownBy(() -> service.create(request, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("impactedUserGroupIds");
        verify(repository, never()).save(any());
    }

    @Test
    void updateStatus_AcceptedToInProgressWithoutTechLead_ThrowsBadRequest() {
        problem.setStatus(TicketStatus.ACCEPTED);
        problem.setBtbTechLeadUsername(null);
        when(repository.findById(1L)).thenReturn(Optional.of(problem));
        when(userRepository.findByUsernameIgnoreCase("admin"))
                .thenReturn(Optional.of(User.builder().id(1L).username("admin").role(UserRole.ADMIN).active(true).build()));

        assertThatThrownBy(() -> service.updateStatus(1L, "IN_PROGRESS", "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("BTB Tech Lead must be assigned");
        verify(repository, never()).save(any());
    }

    @Test
    void updateStatus_AcceptedToInProgressByNonAdmin_ThrowsBadRequest() {
        problem.setStatus(TicketStatus.ACCEPTED);
        problem.setBtbTechLeadUsername("techlead");
        when(repository.findById(1L)).thenReturn(Optional.of(problem));
        when(userRepository.findByUsernameIgnoreCase("rtb"))
                .thenReturn(Optional.of(User.builder().id(2L).username("rtb").role(UserRole.RTB_OWNER).active(true).build()));

        assertThatThrownBy(() -> service.updateStatus(1L, "IN_PROGRESS", "rtb"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only ADMIN can move ticket from ACCEPTED to IN_PROGRESS");
        verify(repository, never()).save(any());
    }

    @Test
    void updateStatus_WhenMovedToAccepted_SendsNotificationUsingFallbackRecipients() {
        problem.setStatus(TicketStatus.ASSIGNED);
        problem.getApplications().clear();
        when(repository.findById(1L)).thenReturn(Optional.of(problem));
        when(repository.save(any())).thenReturn(problem);
        when(mapper.toResponse(any())).thenReturn(response);
        when(appSettingsService.getSettings(false)).thenReturn(
                AppSettingsResponse.builder().settings(Map.of("acceptedTicketEmailEnabled", "true")).build()
        );
        User techLead = User.builder()
                .id(10L)
                .username("techlead")
                .email("techlead@enterprise.com")
                .role(UserRole.TECH_LEAD)
                .active(true)
                .build();
        when(userRepository.findByRoleInAndActiveTrue(List.of(UserRole.TECH_LEAD))).thenReturn(List.of(techLead));
        when(emailService.sendEmail(any(), any(), any())).thenReturn(true);

        FastProblemResponse result = service.updateStatus(1L, "ACCEPTED", "admin");

        assertThat(result).isNotNull();
        verify(emailService).sendEmail(eq("techlead@enterprise.com"), contains("accepted"), any());
        verify(auditLogService, atLeastOnce()).logAction(eq(1L), eq("ACCEPTED_NOTIFICATION"), eq("admin"), any(), any(), contains("SENT:1"));
    }
}
