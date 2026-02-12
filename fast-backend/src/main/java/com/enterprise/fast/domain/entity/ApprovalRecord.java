package com.enterprise.fast.domain.entity;

import com.enterprise.fast.domain.enums.ApprovalDecision;
import com.enterprise.fast.domain.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fast_problem_id", nullable = false)
    private FastProblem fastProblem;

    /** Which approval slot this is: REVIEWER, APPROVER, or RTB_OWNER. Anyone with that role can approve. */
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_role", nullable = false, length = 20)
    private UserRole approvalRole;

    /** Who performed the decision (set when someone approves/rejects); null while PENDING. */
    @Column(name = "reviewer_name", length = 100)
    private String reviewerName;

    @Column(name = "reviewer_email", length = 100)
    private String reviewerEmail;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private ApprovalDecision decision = ApprovalDecision.PENDING;

    @Lob
    private String comments;

    @Column(name = "decision_date")
    private LocalDateTime decisionDate;

    @Column(name = "created_date")
    @Builder.Default
    private LocalDateTime createdDate = LocalDateTime.now();
}
