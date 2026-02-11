package com.enterprise.fast.mapper;

import com.enterprise.fast.domain.entity.*;
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
        return FastProblem.builder()
                .servicenowIncidentNumber(request.getServicenowIncidentNumber())
                .servicenowProblemNumber(request.getServicenowProblemNumber())
                .pbtId(request.getPbtId())
                .title(request.getTitle())
                .description(request.getDescription())
                .userImpactCount(request.getUserImpactCount() != null ? request.getUserImpactCount() : 0)
                .affectedApplication(request.getAffectedApplication())
                .anticipatedBenefits(request.getAnticipatedBenefits())
                .regionalCode(RegionalCode.valueOf(request.getRegionalCode()))
                .targetResolutionHours(request.getTargetResolutionHours() != null ? request.getTargetResolutionHours() : 4)
                .priority(request.getPriority() != null ? Math.max(1, Math.min(5, request.getPriority())) : 3)
                .assignedTo(request.getAssignedTo())
                .assignmentGroup(request.getAssignmentGroup())
                .confluenceLink(request.getConfluenceLink())
                .createdBy(createdBy)
                .build();
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
                .anticipatedBenefits(entity.getAnticipatedBenefits())
                .classification(entity.getClassification() != null ? entity.getClassification().name() : null)
                .regionalCode(entity.getRegionalCode() != null ? entity.getRegionalCode().name() : null)
                .ticketAgeDays(entity.getTicketAgeDays())
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
                .confluenceLink(entity.getConfluenceLink())
                .createdDate(entity.getCreatedDate())
                .updatedDate(entity.getUpdatedDate())
                .resolvedDate(entity.getResolvedDate())
                .approvalRecords(entity.getApprovalRecords() != null ?
                        deduplicateApprovalRecordsByReviewer(entity.getApprovalRecords()).stream().map(this::toApprovalResponse).collect(Collectors.toList()) :
                        Collections.emptyList())
                .incidentLinks(entity.getIncidentLinks() != null ?
                        entity.getIncidentLinks().stream().map(this::toIncidentLinkResponse).collect(Collectors.toList()) :
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
                .classification(entity.getClassification() != null ? entity.getClassification().name() : null)
                .regionalCode(entity.getRegionalCode() != null ? entity.getRegionalCode().name() : null)
                .ticketAgeDays(entity.getTicketAgeDays())
                .statusIndicator(entity.getStatusIndicator() != null ? entity.getStatusIndicator().name() : null)
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .priorityScore(entity.getPriorityScore())
                .priority(entity.getPriority() != null ? Math.max(1, Math.min(5, entity.getPriority())) : 3)
                .targetResolutionHours(entity.getTargetResolutionHours())
                .createdBy(entity.getCreatedBy())
                .assignedTo(entity.getAssignedTo())
                .confluenceLink(entity.getConfluenceLink())
                .createdDate(entity.getCreatedDate())
                .updatedDate(entity.getUpdatedDate())
                .build();
    }

    /** Keep one approval record per reviewer (earliest by id) to avoid duplicate rows from multiple submissions. */
    private List<ApprovalRecord> deduplicateApprovalRecordsByReviewer(List<ApprovalRecord> records) {
        if (records == null || records.isEmpty()) return Collections.emptyList();
        return records.stream()
                .collect(Collectors.groupingBy(ApprovalRecord::getReviewerName))
                .values().stream()
                .map(group -> group.stream().min(Comparator.comparing(ApprovalRecord::getId)).orElseThrow())
                .sorted(Comparator.comparing(ApprovalRecord::getId))
                .collect(Collectors.toList());
    }

    public ApprovalResponse toApprovalResponse(ApprovalRecord record) {
        return ApprovalResponse.builder()
                .id(record.getId())
                .fastProblemId(record.getFastProblem().getId())
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
}
