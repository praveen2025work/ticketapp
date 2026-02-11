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
    private String reviewerName;
    private String reviewerEmail;
    private String decision;
    private String comments;
    private LocalDateTime decisionDate;
    private LocalDateTime createdDate;
}
