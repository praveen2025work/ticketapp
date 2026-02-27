package com.enterprise.fast.mapper;

import com.enterprise.fast.domain.entity.*;
import com.enterprise.fast.dto.response.TicketCommentResponse;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.dto.request.CreateFastProblemRequest;
import com.enterprise.fast.dto.response.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class FastProblemMapper {

    public FastProblem toEntity(CreateFastProblemRequest request, String createdBy) {
        FastProblem problem = FastProblem.builder()
                .servicenowIncidentNumber(request.getServicenowIncidentNumber())
                .servicenowProblemNumber(request.getServicenowProblemNumber())
                .pbtId(request.getPbtId())
                .title(request.getTitle())
                .description(request.getDescription())
                .userImpactCount(request.getUserImpactCount() != null ? request.getUserImpactCount() : 0)
                .affectedApplication(request.getAffectedApplication())
                .requestNumber(request.getRequestNumber())
                .dqReference(request.getDqReference())
                .impactedUserGroupNotes(request.getImpactedUserGroupNotes())
                .anticipatedBenefits(request.getAnticipatedBenefits())
                .targetResolutionHours(request.getTargetResolutionHours() != null ? request.getTargetResolutionHours() : 4)
                .priority(request.getPriority() != null ? Math.max(1, Math.min(5, request.getPriority())) : 3)
                .assignedTo(request.getAssignedTo())
                .assignmentGroup(request.getAssignmentGroup())
                .confluenceLink(request.getConfluenceLink())
                .createdBy(createdBy)
                .build();
        if (request.getRegionalCodes() != null && !request.getRegionalCodes().isEmpty()) {
            for (String code : request.getRegionalCodes()) {
                FastProblemRegion r = FastProblemRegion.builder()
                        .fastProblem(problem)
                        .regionalCode(RegionalCode.valueOf(code))
                        .build();
                problem.getRegions().add(r);
            }
        }
        return problem;
    }

    public FastProblemResponse toResponse(FastProblem entity) {
        return FastProblemResponse.builder()
                .id(entity.getId())
                .servicenowIncidentNumber(entity.getServicenowIncidentNumber())
                .servicenowProblemNumber(entity.getServicenowProblemNumber())
                .pbtId(entity.getPbtId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .userImpactCount(entity.getUserImpactCount())
                .affectedApplication(entity.getAffectedApplication())
                .requestNumber(entity.getRequestNumber())
                .dqReference(entity.getDqReference())
                .applications(entity.getApplications() != null ? entity.getApplications().stream()
                        .map(a -> ApplicationResponse.builder()
                                .id(a.getId())
                                .name(a.getName())
                                .code(a.getCode())
                                .description(a.getDescription())
                                .createdDate(a.getCreatedDate())
                                .updatedDate(a.getUpdatedDate())
                                .build())
                        .collect(Collectors.toList()) : Collections.emptyList())
                .impactedUserGroups(entity.getUserGroups() != null ? entity.getUserGroups().stream()
                        .map(g -> UserGroupResponse.builder()
                                .id(g.getId())
                                .name(g.getName())
                                .code(g.getCode())
                                .description(g.getDescription())
                                .active(g.getActive())
                                .createdDate(g.getCreatedDate())
                                .updatedDate(g.getUpdatedDate())
                                .build())
                        .collect(Collectors.toList()) : Collections.emptyList())
                .impactedUserGroupNotes(entity.getImpactedUserGroupNotes())
                .anticipatedBenefits(entity.getAnticipatedBenefits())
                .classification(entity.getClassification() != null ? entity.getClassification().name() : null)
                .regionalCodes(regionCodesFromEntity(entity))
                .ticketAgeDays(entity.getTicketAgeDays())
                .ragStatus(entity.getRagStatus() != null ? entity.getRagStatus().name() : null)
                .statusIndicator(entity.getStatusIndicator() != null ? entity.getStatusIndicator().name() : null)
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .priorityScore(entity.getPriorityScore())
                .priority(entity.getPriority() != null ? Math.max(1, Math.min(5, entity.getPriority())) : 3)
                .targetResolutionHours(entity.getTargetResolutionHours())
                .apiIntegrationStatus(entity.getApiIntegrationStatus() != null ? entity.getApiIntegrationStatus().name() : null)
                .rootCause(entity.getRootCause())
                .workaround(entity.getWorkaround())
                .permanentFix(entity.getPermanentFix())
                .createdBy(entity.getCreatedBy())
                .assignedTo(entity.getAssignedTo())
                .assignmentGroup(entity.getAssignmentGroup())
                .btbTechLeadUsername(entity.getBtbTechLeadUsername())
                .confluenceLink(entity.getConfluenceLink())
                .createdDate(entity.getCreatedDate())
                .updatedDate(entity.getUpdatedDate())
                .resolvedDate(entity.getResolvedDate())
                .inProgressDate(entity.getInProgressDate())
                .approvalRecords(entity.getApprovalRecords() != null ?
                        deduplicateApprovalRecordsByReviewer(entity.getApprovalRecords()).stream().map(this::toApprovalResponse).collect(Collectors.toList()) :
                        Collections.emptyList())
                .incidentLinks(entity.getIncidentLinks() != null ?
                        entity.getIncidentLinks().stream().map(this::toIncidentLinkResponse).collect(Collectors.toList()) :
                        Collections.emptyList())
                .links(entity.getLinks() != null ?
                        entity.getLinks().stream().filter(java.util.Objects::nonNull).map(this::toProblemLinkResponse).filter(java.util.Objects::nonNull).collect(Collectors.toList()) :
                        Collections.emptyList())
                .properties(entity.getProperties() != null ?
                        entity.getProperties().stream().map(this::toPropertyResponse).collect(Collectors.toList()) :
                        Collections.emptyList())
                .comments(entity.getComments() != null ?
                        entity.getComments().stream().map(this::toCommentResponse).collect(Collectors.toList()) :
                        Collections.emptyList())
                .knowledgeArticle(entity.getKnowledgeArticle() != null ?
                        toKnowledgeArticleResponse(entity.getKnowledgeArticle()) : null)
                .build();
    }

    public FastProblemResponse toSummaryResponse(FastProblem entity) {
        return FastProblemResponse.builder()
                .id(entity.getId())
                .servicenowIncidentNumber(entity.getServicenowIncidentNumber())
                .servicenowProblemNumber(entity.getServicenowProblemNumber())
                .pbtId(entity.getPbtId())
                .title(entity.getTitle())
                .userImpactCount(entity.getUserImpactCount())
                .affectedApplication(entity.getAffectedApplication())
                .requestNumber(entity.getRequestNumber())
                .dqReference(entity.getDqReference())
                .impactedUserGroups(entity.getUserGroups() != null ? entity.getUserGroups().stream()
                        .map(g -> UserGroupResponse.builder()
                                .id(g.getId())
                                .name(g.getName())
                                .code(g.getCode())
                                .description(g.getDescription())
                                .active(g.getActive())
                                .createdDate(g.getCreatedDate())
                                .updatedDate(g.getUpdatedDate())
                                .build())
                        .collect(Collectors.toList()) : Collections.emptyList())
                .impactedUserGroupNotes(entity.getImpactedUserGroupNotes())
                .classification(entity.getClassification() != null ? entity.getClassification().name() : null)
                .regionalCodes(regionCodesFromEntity(entity))
                .ticketAgeDays(entity.getTicketAgeDays())
                .ragStatus(entity.getRagStatus() != null ? entity.getRagStatus().name() : null)
                .statusIndicator(entity.getStatusIndicator() != null ? entity.getStatusIndicator().name() : null)
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .priorityScore(entity.getPriorityScore())
                .priority(entity.getPriority() != null ? Math.max(1, Math.min(5, entity.getPriority())) : 3)
                .targetResolutionHours(entity.getTargetResolutionHours())
                .createdBy(entity.getCreatedBy())
                .assignedTo(entity.getAssignedTo())
                .btbTechLeadUsername(entity.getBtbTechLeadUsername())
                .confluenceLink(entity.getConfluenceLink())
                .createdDate(entity.getCreatedDate())
                .updatedDate(entity.getUpdatedDate())
                .resolvedDate(entity.getResolvedDate())
                .inProgressDate(entity.getInProgressDate())
                .links(entity.getLinks() != null ?
                        entity.getLinks().stream().filter(java.util.Objects::nonNull).map(this::toProblemLinkResponse).filter(java.util.Objects::nonNull).collect(Collectors.toList()) :
                        Collections.emptyList())
                .build();
    }

    private List<String> regionCodesFromEntity(FastProblem entity) {
        if (entity.getRegions() == null || entity.getRegions().isEmpty()) return Collections.emptyList();
        return entity.getRegions().stream()
                .filter(r -> r != null && r.getRegionalCode() != null)
                .map(r -> r.getRegionalCode().name())
                .collect(Collectors.toList());
    }

    /** One record per approval role (REVIEWER, APPROVER, RTB_OWNER); keep earliest by id if duplicates exist. */
    private List<ApprovalRecord> deduplicateApprovalRecordsByReviewer(List<ApprovalRecord> records) {
        if (records == null || records.isEmpty()) return Collections.emptyList();
        return records.stream()
                .collect(Collectors.groupingBy(r -> r.getApprovalRole() != null ? r.getApprovalRole() : "LEGACY"))
                .values().stream()
                .map(group -> group.stream().min(Comparator.comparing(ApprovalRecord::getId)).orElseThrow())
                .sorted(Comparator.comparing(ApprovalRecord::getId))
                .collect(Collectors.toList());
    }

    public ApprovalResponse toApprovalResponse(ApprovalRecord record) {
        return ApprovalResponse.builder()
                .id(record.getId())
                .fastProblemId(record.getFastProblem().getId())
                .fastProblemTitle(record.getFastProblem().getTitle())
                .approvalRole(record.getApprovalRole() != null ? record.getApprovalRole().name() : null)
                .reviewerName(record.getReviewerName())
                .reviewerEmail(record.getReviewerEmail())
                .decision(record.getDecision() != null ? record.getDecision().name() : null)
                .comments(record.getComments())
                .decisionDate(record.getDecisionDate())
                .createdDate(record.getCreatedDate())
                .build();
    }

    public KnowledgeArticleResponse toKnowledgeArticleResponse(KnowledgeArticle article) {
        return KnowledgeArticleResponse.builder()
                .id(article.getId())
                .fastProblemId(article.getFastProblem() != null ? article.getFastProblem().getId() : null)
                .title(article.getTitle())
                .rootCause(article.getRootCause())
                .workaround(article.getWorkaround())
                .permanentFix(article.getPermanentFix())
                .category(article.getCategory())
                .status(article.getStatus() != null ? article.getStatus().name() : null)
                .createdDate(article.getCreatedDate())
                .publishedDate(article.getPublishedDate())
                .build();
    }

    public IncidentLinkResponse toIncidentLinkResponse(IncidentLink link) {
        return IncidentLinkResponse.builder()
                .id(link.getId())
                .fastProblemId(link.getFastProblem().getId())
                .incidentNumber(link.getIncidentNumber())
                .linkType(link.getLinkType() != null ? link.getLinkType().name() : null)
                .description(link.getDescription())
                .linkedDate(link.getLinkedDate())
                .build();
    }

    public TicketPropertyResponse toPropertyResponse(FastProblemProperty p) {
        return TicketPropertyResponse.builder()
                .key(p.getPropertyKey())
                .value(p.getPropertyValue())
                .build();
    }

    public FastProblemLinkResponse toProblemLinkResponse(FastProblemLink link) {
        if (link == null) return null;
        return FastProblemLinkResponse.builder()
                .id(link.getId())
                .label(link.getLabel())
                .url(link.getUrl())
                .linkType(link.getLinkType() != null ? link.getLinkType().name() : null)
                .build();
    }

    public TicketCommentResponse toCommentResponse(TicketComment c) {
        return TicketCommentResponse.builder()
                .id(c.getId())
                .authorUsername(c.getAuthorUsername())
                .commentText(c.getCommentText())
                .createdDate(c.getCreatedDate())
                .build();
    }
}
