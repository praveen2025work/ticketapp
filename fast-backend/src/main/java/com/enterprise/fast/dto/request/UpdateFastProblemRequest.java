package com.enterprise.fast.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateFastProblemRequest {

    private String servicenowIncidentNumber;

    private String servicenowProblemNumber;

    private String title;

    private String description;

    private Integer userImpactCount;

    private String affectedApplication;

    private String anticipatedBenefits;

    private String regionalCode;

    private Integer targetResolutionHours;

    @Min(1) @Max(5)
    private Integer priority;

    private String assignedTo;

    private String assignmentGroup;

    private String rootCause;

    private String workaround;

    private String permanentFix;

    private String confluenceLink;
}
