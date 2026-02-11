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
public class IncidentLinkResponse {

    private Long id;
    private Long fastProblemId;
    private String incidentNumber;
    private String linkType;
    private String description;
    private LocalDateTime linkedDate;
}
