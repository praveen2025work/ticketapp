package com.enterprise.fast.domain.entity;

import com.enterprise.fast.domain.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "fast_problem")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FastProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "servicenow_incident_number", length = 20)
    private String servicenowIncidentNumber;

    @Column(name = "servicenow_problem_number", length = 20)
    private String servicenowProblemNumber;

    @Column(name = "pbt_id", length = 30)
    private String pbtId;

    @Column(nullable = false)
    private String title;

    @Lob
    private String description;

    @Column(name = "user_impact_count")
    @Builder.Default
    private Integer userImpactCount = 0;

    @Column(name = "affected_application", length = 100)
    private String affectedApplication;

    @Column(name = "request_number", length = 100)
    private String requestNumber;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "fast_problem_application",
            joinColumns = @JoinColumn(name = "fast_problem_id"),
            inverseJoinColumns = @JoinColumn(name = "application_id")
    )
    @Builder.Default
    private List<Application> applications = new ArrayList<>();

    @Lob
    @Column(name = "anticipated_benefits")
    private String anticipatedBenefits;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private Classification classification = Classification.A;

    @OneToMany(mappedBy = "fastProblem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FastProblemRegion> regions = new ArrayList<>();

    @Column(name = "ticket_age_days")
    @Builder.Default
    private Integer ticketAgeDays = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_indicator", length = 10)
    @Builder.Default
    private StatusIndicator statusIndicator = StatusIndicator.R16;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private TicketStatus status = TicketStatus.NEW;

    @Column(name = "priority_score")
    @Builder.Default
    private Double priorityScore = 0.0;

    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 3;

    @Column(name = "target_resolution_hours")
    @Builder.Default
    private Integer targetResolutionHours = 4;

    @Enumerated(EnumType.STRING)
    @Column(name = "api_integration_status", length = 20)
    @Builder.Default
    private ApiIntegrationStatus apiIntegrationStatus = ApiIntegrationStatus.MANUAL_ENTRY;

    @Lob
    @Column(name = "root_cause")
    private String rootCause;

    @Lob
    private String workaround;

    @Lob
    @Column(name = "permanent_fix")
    private String permanentFix;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "assigned_to", length = 50)
    private String assignedTo;

    @Column(name = "assignment_group", length = 100)
    private String assignmentGroup;

    /** BTB Tech Lead (reference) — assignable once all approvals are done (ticket ASSIGNED). */
    @Column(name = "btb_tech_lead_username", length = 50)
    private String btbTechLeadUsername;

    @Column(name = "confluence_link", length = 500)
    private String confluenceLink;

    @Column(name = "created_date")
    @Builder.Default
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "updated_date")
    @Builder.Default
    private LocalDateTime updatedDate = LocalDateTime.now();

    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;

    @Builder.Default
    private Boolean deleted = false;

    @OneToMany(mappedBy = "fastProblem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ApprovalRecord> approvalRecords = new ArrayList<>();

    @OneToMany(mappedBy = "fastProblem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FastProblemProperty> properties = new ArrayList<>();

    @OneToMany(mappedBy = "fastProblem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FastProblemLink> links = new ArrayList<>();

    @OneToMany(mappedBy = "fastProblem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IncidentLink> incidentLinks = new ArrayList<>();

    @OneToOne(mappedBy = "fastProblem", cascade = CascadeType.ALL)
    private KnowledgeArticle knowledgeArticle;

    @OneToMany(mappedBy = "fastProblem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdDate DESC")
    @Builder.Default
    private List<TicketComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "fastProblem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AuditLog> auditLogs = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}
