package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FastProblemResponse {

    private Long id;
    private String servicenowIncidentNumber;
    private String servicenowProblemNumber;
    private String pbtId;
    private String title;
    private String description;
    private Integer userImpactCount;
    private String affectedApplication;
    private String requestNumber;
    private List<ApplicationResponse> applications;
    private String anticipatedBenefits;
    private String classification;
    private List<String> regionalCodes;
    private Integer ticketAgeDays;
    private String statusIndicator;
    private String status;
    private Double priorityScore;
    private Integer priority;
    private Integer targetResolutionHours;
    private String apiIntegrationStatus;
    private String rootCause;
    private String workaround;
    private String permanentFix;
    private String createdBy;
    private String assignedTo;
    private String assignmentGroup;
    private String btbTechLeadUsername;
    private String confluenceLink;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private LocalDateTime resolvedDate;
    private List<ApprovalResponse> approvalRecords;
    private List<IncidentLinkResponse> incidentLinks;
    private List<FastProblemLinkResponse> links;
    private List<TicketPropertyResponse> properties;
    private List<TicketCommentResponse> comments;
    private KnowledgeArticleResponse knowledgeArticle;
}
