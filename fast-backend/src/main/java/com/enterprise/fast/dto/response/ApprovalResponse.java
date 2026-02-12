package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalResponse {

    private Long id;
    private Long fastProblemId;
    /** Ticket title for display in approval queue. */
    private String fastProblemTitle;
    /** Which approval slot: REVIEWER, APPROVER, or RTB_OWNER. */
    private String approvalRole;
    private String reviewerName;
    private String reviewerEmail;
    private String decision;
    private String comments;
    private LocalDateTime decisionDate;
    private LocalDateTime createdDate;
}
