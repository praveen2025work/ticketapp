package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.Application;
import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.*;
import com.enterprise.fast.dto.request.CreateFastProblemRequest;
import com.enterprise.fast.dto.request.UpdateFastProblemRequest;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.mapper.FastProblemMapper;
import com.enterprise.fast.domain.entity.FastProblemLink;
import com.enterprise.fast.domain.entity.FastProblemProperty;
import com.enterprise.fast.domain.entity.TicketComment;
import com.enterprise.fast.repository.ApplicationRepository;
import com.enterprise.fast.repository.FastProblemLinkRepository;
import com.enterprise.fast.repository.FastProblemPropertyRepository;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.FastProblemSpecification;
import com.enterprise.fast.repository.UserRepository;
import com.enterprise.fast.service.AppSettingsService;
import com.enterprise.fast.service.AuditLogService;
import com.enterprise.fast.service.EmailService;
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
    private final FastProblemPropertyRepository propertyRepository;
    private final FastProblemLinkRepository linkRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final AppSettingsService appSettingsService;
    private final EmailService emailService;
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

        // Auto-assign regional group if not provided (use first region)
        if ((problem.getAssignmentGroup() == null || problem.getAssignmentGroup().isBlank())
                && problem.getRegions() != null && !problem.getRegions().isEmpty()) {
            problem.setAssignmentGroup(problem.getRegions().get(0).getRegionalCode().name() + "-Problem-Team");
        }

        if (request.getApplicationIds() != null && !request.getApplicationIds().isEmpty()) {
            List<Application> apps = applicationRepository.findAllById(request.getApplicationIds());
            problem.getApplications().clear();
            problem.getApplications().addAll(apps);
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
        Page<FastProblem> problemPage = repository.findByRegions_RegionalCodeAndDeletedFalse(region, PageRequest.of(page, size));
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
        Specification<FastProblem> spec = FastProblemSpecification.withFilters(keyword, null, null, null, null, null, null);
        Page<FastProblem> problemPage = repository.findAll(spec, PageRequest.of(page, size, Sort.by("createdDate").descending()));
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
        if (request.getRequestNumber() != null) {
            problem.setRequestNumber(request.getRequestNumber().trim().isEmpty() ? null : request.getRequestNumber().trim());
        }
        if (request.getApplicationIds() != null) {
            problem.getApplications().clear();
            if (!request.getApplicationIds().isEmpty()) {
                List<Application> apps = applicationRepository.findAllById(request.getApplicationIds());
                problem.getApplications().addAll(apps);
            }
        }
        if (request.getAnticipatedBenefits() != null) {
            problem.setAnticipatedBenefits(request.getAnticipatedBenefits());
        }
        if (request.getRegionalCodes() != null && !request.getRegionalCodes().isEmpty()) {
            List<RegionalCode> desired = request.getRegionalCodes().stream()
                    .filter(c -> c != null && !c.isBlank())
                    .distinct()
                    .map(c -> {
                        try {
                            return RegionalCode.valueOf(c.trim().toUpperCase());
                        } catch (IllegalArgumentException e) {
                            return null;
                        }
                    })
                    .filter(rc -> rc != null)
                    .toList();
            // Remove regions not in desired (orphanRemoval will delete rows)
            problem.getRegions().removeIf(r -> !desired.contains(r.getRegionalCode()));
            // Add only regions that are not already present (avoids unique constraint on save)
            java.util.Set<RegionalCode> existing = problem.getRegions().stream()
                    .map(com.enterprise.fast.domain.entity.FastProblemRegion::getRegionalCode)
                    .collect(java.util.stream.Collectors.toSet());
            for (RegionalCode rc : desired) {
                if (!existing.contains(rc)) {
                    problem.getRegions().add(com.enterprise.fast.domain.entity.FastProblemRegion.builder()
                            .fastProblem(problem)
                            .regionalCode(rc)
                            .build());
                }
            }
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
        if (request.getBtbTechLeadUsername() != null && !request.getBtbTechLeadUsername().isBlank()) {
            applyBtbTechLead(problem, request.getBtbTechLeadUsername().trim());
        } else if (request.getBtbTechLeadUsername() != null && request.getBtbTechLeadUsername().isBlank()) {
            problem.setBtbTechLeadUsername(null);
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
    public FastProblemResponse updateBtbTechLead(Long id, String btbTechLeadUsername, String username) {
        FastProblem problem = findProblemOrThrow(id);
        String oldValue = problem.getBtbTechLeadUsername();
        applyBtbTechLead(problem, btbTechLeadUsername != null ? btbTechLeadUsername : "");
        FastProblem saved = repository.save(problem);
        auditLogService.logAction(id, "FIELD_UPDATED", username, "btbTechLeadUsername", oldValue, saved.getBtbTechLeadUsername());
        return mapper.toResponse(saved);
    }

    private void applyBtbTechLead(FastProblem problem, String value) {
        if (value == null) {
            problem.setBtbTechLeadUsername(null);
            return;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            problem.setBtbTechLeadUsername(null);
            return;
        }
        User techLead = userRepository.findByUsernameIgnoreCase(trimmed)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + trimmed));
        if (techLead.getRole() != UserRole.TECH_LEAD) {
            throw new IllegalArgumentException("BTB Tech Lead must be a user with role TECH_LEAD: " + trimmed);
        }
        problem.setBtbTechLeadUsername(techLead.getUsername());
    }

    @Override
    @Transactional
    public FastProblemResponse updateStatus(Long id, String newStatus, String username) {
        FastProblem problem = findProblemOrThrow(id);
        TicketStatus targetStatus = TicketStatus.valueOf(newStatus.toUpperCase());
        TicketStatus currentStatus = problem.getStatus();

        StatusTransitionValidator.validate(currentStatus, targetStatus);

        // Only ADMIN can close or reject a ticket directly (NEW/ASSIGNED -> CLOSED or REJECTED)
        if ((targetStatus == TicketStatus.CLOSED || targetStatus == TicketStatus.REJECTED)
                && (currentStatus == TicketStatus.NEW || currentStatus == TicketStatus.ASSIGNED)) {
            User user = userRepository.findByUsernameIgnoreCase(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
            if (user.getRole() != UserRole.ADMIN) {
                throw new IllegalArgumentException("Only ADMIN can close or reject a ticket from NEW or ASSIGNED");
            }
        }

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

    @Override
    @Transactional
    public FastProblemResponse addProperty(Long problemId, String key, String value) {
        FastProblem problem = findProblemOrThrow(problemId);
        if (key == null || key.isBlank()) throw new IllegalArgumentException("Property key is required");
        problem.getProperties().stream()
                .filter(p -> key.equals(p.getPropertyKey()))
                .findFirst()
                .ifPresent(p -> {
                    p.setPropertyValue(value != null ? value : "");
                });
        if (problem.getProperties().stream().noneMatch(p -> key.equals(p.getPropertyKey()))) {
            FastProblemProperty prop = FastProblemProperty.builder()
                    .fastProblem(problem)
                    .propertyKey(key.trim())
                    .propertyValue(value != null ? value : "")
                    .build();
            problem.getProperties().add(prop);
        }
        FastProblem saved = repository.save(problem);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public FastProblemResponse updateProperty(Long problemId, String key, String value) {
        FastProblem problem = findProblemOrThrow(problemId);
        propertyRepository.findByFastProblemIdAndPropertyKey(problemId, key).ifPresent(p -> {
            p.setPropertyValue(value != null ? value : "");
            propertyRepository.save(p);
        });
        return mapper.toResponse(repository.findById(problemId).orElseThrow());
    }

    @Override
    @Transactional
    public void deleteProperty(Long problemId, String key) {
        findProblemOrThrow(problemId);
        propertyRepository.deleteByFastProblemIdAndPropertyKey(problemId, key);
    }

    @Override
    @Transactional
    public FastProblemResponse addLink(Long problemId, String label, String url) {
        return addLink(problemId, label, url, null);
    }

    @Override
    @Transactional
    public FastProblemResponse addLink(Long problemId, String label, String url, String linkType) {
        FastProblem problem = findProblemOrThrow(problemId);
        if (label == null || label.isBlank() || url == null || url.isBlank()) {
            throw new IllegalArgumentException("Label and URL are required");
        }
        com.enterprise.fast.domain.enums.ExternalLinkType type = com.enterprise.fast.domain.enums.ExternalLinkType.OTHER;
        if (linkType != null && !linkType.isBlank()) {
            try {
                type = com.enterprise.fast.domain.enums.ExternalLinkType.valueOf(linkType.toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }
        FastProblemLink link = FastProblemLink.builder()
                .fastProblem(problem)
                .label(label.trim())
                .url(url.trim())
                .linkType(type)
                .build();
        problem.getLinks().add(link);
        FastProblem saved = repository.save(problem);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteLink(Long problemId, Long linkId) {
        FastProblem problem = findProblemOrThrow(problemId);
        problem.getLinks().removeIf(l -> l.getId().equals(linkId));
        repository.save(problem);
    }

    @Override
    @Transactional
    public FastProblemResponse addComment(Long problemId, String text, String username) {
        FastProblem problem = findProblemOrThrow(problemId);
        if (text == null || text.isBlank()) throw new IllegalArgumentException("Comment text is required");
        TicketComment comment = TicketComment.builder()
                .fastProblem(problem)
                .authorUsername(username)
                .commentText(text.trim())
                .build();
        problem.getComments().add(comment);
        FastProblem saved = repository.save(problem);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public void sendEmailToAssignee(Long problemId, String message) {
        FastProblem problem = findProblemOrThrow(problemId);
        String assignedTo = problem.getAssignedTo();
        if (assignedTo == null || assignedTo.isBlank()) {
            throw new IllegalArgumentException("Ticket has no assignee");
        }
        User assignee = userRepository.findByUsernameIgnoreCase(assignedTo)
                .orElseThrow(() -> new IllegalArgumentException("Assignee user not found: " + assignedTo));
        if (assignee.getEmail() == null || assignee.getEmail().isBlank()) {
            throw new IllegalArgumentException("Assignee has no email address");
        }
        Map<String, String> settings = appSettingsService.getSettings(false).getSettings();
        if (!"true".equalsIgnoreCase(settings.get("ticketEmailEnabled"))) {
            throw new IllegalStateException("Ticket email feature is disabled in settings");
        }
        String subject = "FAST Ticket #" + problem.getId() + ": " + problem.getTitle();
        String body = "<h3>Ticket #" + problem.getId() + "</h3>"
                + "<p><strong>Title:</strong> " + escapeHtml(problem.getTitle()) + "</p>"
                + "<p><strong>Status:</strong> " + (problem.getStatus() != null ? problem.getStatus().name() : "") + "</p>"
                + (problem.getDescription() != null ? "<p><strong>Description:</strong><br/>" + escapeHtml(problem.getDescription()) + "</p>" : "")
                + (message != null && !message.isBlank() ? "<p><strong>Message:</strong><br/>" + escapeHtml(message) + "</p>" : "");
        boolean sent = emailService.sendEmail(assignee.getEmail(), subject, body);
        if (!sent) {
            throw new IllegalStateException("Failed to send email");
        }
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
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
