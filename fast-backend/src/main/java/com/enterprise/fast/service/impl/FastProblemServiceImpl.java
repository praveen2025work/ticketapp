package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.*;
import com.enterprise.fast.dto.request.CreateFastProblemRequest;
import com.enterprise.fast.dto.request.UpdateFastProblemRequest;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.mapper.FastProblemMapper;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.FastProblemSpecification;
import com.enterprise.fast.service.AuditLogService;
import com.enterprise.fast.util.StatusTransitionValidator;
import com.enterprise.fast.service.FastProblemService;
import com.enterprise.fast.service.KnowledgeArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FastProblemServiceImpl implements FastProblemService {

    private final FastProblemRepository repository;
    private final FastProblemMapper mapper;
    private final AuditLogService auditLogService;
    private final KnowledgeArticleService knowledgeArticleService;

    private static final double USER_IMPACT_WEIGHT = 0.6;
    private static final double APP_CRITICALITY_WEIGHT = 0.4;
    private static final double DEFAULT_APP_CRITICALITY = 3.0;

    @Override
    @Transactional
    public FastProblemResponse create(CreateFastProblemRequest request, String username) {
        FastProblem problem = mapper.toEntity(request, username);

        // Calculate priority score
        problem.setPriorityScore(calculatePriorityScore(problem.getUserImpactCount()));

        // Auto-assign regional group if not provided
        if (problem.getAssignmentGroup() == null || problem.getAssignmentGroup().isBlank()) {
            problem.setAssignmentGroup(problem.getRegionalCode().name() + "-Problem-Team");
        }

        FastProblem saved = repository.save(problem);

        auditLogService.logAction(saved.getId(), "CREATED", username, null, null, null);

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FastProblemResponse getById(Long id) {
        FastProblem problem = findProblemOrThrow(id);
        return mapper.toResponse(problem);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FastProblemResponse> getAll(int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FastProblem> problemPage = repository.findByDeletedFalse(pageable);
        return toPagedResponse(problemPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FastProblemResponse> getByRegion(String regionCode, int page, int size) {
        RegionalCode region = RegionalCode.valueOf(regionCode.toUpperCase());
        Page<FastProblem> problemPage = repository.findByRegionalCodeAndDeletedFalse(region, PageRequest.of(page, size));
        return toPagedResponse(problemPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FastProblemResponse> getByClassification(String classification, int page, int size) {
        Classification cls = Classification.valueOf(classification.toUpperCase());
        Page<FastProblem> problemPage = repository.findByClassificationAndDeletedFalse(cls, PageRequest.of(page, size));
        return toPagedResponse(problemPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FastProblemResponse> getByStatus(String status, int page, int size) {
        TicketStatus ticketStatus = TicketStatus.valueOf(status.toUpperCase());
        Page<FastProblem> problemPage = repository.findByStatusAndDeletedFalse(ticketStatus, PageRequest.of(page, size));
        return toPagedResponse(problemPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FastProblemResponse> search(String keyword, int page, int size) {
        Page<FastProblem> problemPage = repository.searchByKeyword(keyword, PageRequest.of(page, size));
        return toPagedResponse(problemPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FastProblemResponse> findWithFilters(String keyword, String regionCode, String classification,
                                                              String application, LocalDate fromDate, LocalDate toDate,
                                                              String status, int page, int size, String sortBy, String direction) {
        Specification<FastProblem> spec = FastProblemSpecification.withFilters(keyword, regionCode, classification, application, fromDate, toDate, status);
        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FastProblem> problemPage = repository.findAll(spec, pageable);
        return toPagedResponse(problemPage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FastProblemResponse> exportWithFilters(String keyword, String regionCode, String classification,
                                                       String application, LocalDate fromDate, LocalDate toDate,
                                                       String status, int limit) {
        Specification<FastProblem> spec = FastProblemSpecification.withFilters(keyword, regionCode, classification, application, fromDate, toDate, status);
        Pageable pageable = PageRequest.of(0, Math.min(limit, 10000), Sort.by("createdDate").descending());
        return repository.findAll(spec, pageable).getContent().stream()
                .map(mapper::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional
    public FastProblemResponse update(Long id, UpdateFastProblemRequest request, String username) {
        FastProblem problem = findProblemOrThrow(id);

        if (request.getServicenowIncidentNumber() != null) {
            problem.setServicenowIncidentNumber(request.getServicenowIncidentNumber());
        }
        if (request.getServicenowProblemNumber() != null) {
            problem.setServicenowProblemNumber(request.getServicenowProblemNumber());
        }
        if (request.getTitle() != null) {
            problem.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            problem.setDescription(request.getDescription());
        }
        if (request.getUserImpactCount() != null) {
            int oldCount = problem.getUserImpactCount();
            problem.setUserImpactCount(request.getUserImpactCount());
            problem.setPriorityScore(calculatePriorityScore(request.getUserImpactCount()));
            auditLogService.logAction(id, "FIELD_UPDATED", username, "userImpactCount",
                    String.valueOf(oldCount), String.valueOf(request.getUserImpactCount()));
        }
        if (request.getAffectedApplication() != null) {
            problem.setAffectedApplication(request.getAffectedApplication());
        }
        if (request.getAnticipatedBenefits() != null) {
            problem.setAnticipatedBenefits(request.getAnticipatedBenefits());
        }
        if (request.getRegionalCode() != null) {
            problem.setRegionalCode(RegionalCode.valueOf(request.getRegionalCode()));
        }
        if (request.getTargetResolutionHours() != null) {
            problem.setTargetResolutionHours(request.getTargetResolutionHours());
        }
        if (request.getPriority() != null) {
            int clamped = Math.max(1, Math.min(5, request.getPriority()));
            Integer oldPriority = problem.getPriority();
            problem.setPriority(clamped);
            if (oldPriority == null || !oldPriority.equals(clamped)) {
                auditLogService.logAction(id, "FIELD_UPDATED", username, "priority",
                        oldPriority != null ? String.valueOf(oldPriority) : null, String.valueOf(clamped));
            }
        }
        if (request.getAssignedTo() != null) {
            problem.setAssignedTo(request.getAssignedTo());
        }
        if (request.getAssignmentGroup() != null) {
            problem.setAssignmentGroup(request.getAssignmentGroup());
        }
        if (request.getRootCause() != null) {
            problem.setRootCause(request.getRootCause());
        }
        if (request.getWorkaround() != null) {
            problem.setWorkaround(request.getWorkaround());
        }
        if (request.getPermanentFix() != null) {
            problem.setPermanentFix(request.getPermanentFix());
        }
        if (request.getConfluenceLink() != null) {
            String oldLink = problem.getConfluenceLink();
            problem.setConfluenceLink(request.getConfluenceLink().isBlank() ? null : request.getConfluenceLink().trim());
            if (oldLink == null ? problem.getConfluenceLink() != null : !oldLink.equals(problem.getConfluenceLink())) {
                auditLogService.logAction(id, "FIELD_UPDATED", username, "confluenceLink",
                        oldLink, problem.getConfluenceLink());
            }
        }

        FastProblem saved = repository.save(problem);
        auditLogService.logAction(id, "UPDATED", username, null, null, null);

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public FastProblemResponse updateStatus(Long id, String newStatus, String username) {
        FastProblem problem = findProblemOrThrow(id);
        TicketStatus targetStatus = TicketStatus.valueOf(newStatus.toUpperCase());
        TicketStatus currentStatus = problem.getStatus();

        StatusTransitionValidator.validate(currentStatus, targetStatus);

        String oldStatus = currentStatus.name();
        problem.setStatus(targetStatus);

        // Handle resolved status
        if (targetStatus == TicketStatus.RESOLVED) {
            problem.setResolvedDate(LocalDateTime.now());
            problem.setStatusIndicator(StatusIndicator.B16);
            // Auto-create knowledge article
            knowledgeArticleService.createFromResolvedProblem(id);
        }

        // Handle closed status
        if (targetStatus == TicketStatus.CLOSED) {
            problem.setStatusIndicator(StatusIndicator.B16);
        }

        FastProblem saved = repository.save(problem);

        auditLogService.logAction(id, "STATUS_CHANGED", username, "status", oldStatus, targetStatus.name());

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Long id, String username) {
        FastProblem problem = findProblemOrThrow(id);
        problem.setDeleted(true);
        repository.save(problem);
        auditLogService.logAction(id, "DELETED", username, "deleted", "false", "true");
    }

    private FastProblem findProblemOrThrow(Long id) {
        FastProblem problem = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FastProblem", "id", id));
        if (problem.getDeleted()) {
            throw new ResourceNotFoundException("FastProblem", "id", id);
        }
        return problem;
    }

    private double calculatePriorityScore(int userImpactCount) {
        return (userImpactCount * USER_IMPACT_WEIGHT) + (DEFAULT_APP_CRITICALITY * APP_CRITICALITY_WEIGHT);
    }

    private PagedResponse<FastProblemResponse> toPagedResponse(Page<FastProblem> page) {
        return PagedResponse.<FastProblemResponse>builder()
                .content(page.getContent().stream().map(mapper::toSummaryResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
