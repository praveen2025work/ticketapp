package com.enterprise.fast.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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

    private String requestNumber;

    private List<Long> applicationIds;

    private String anticipatedBenefits;

    private List<String> regionalCodes;

    private Integer targetResolutionHours;

    @Min(1) @Max(5)
    private Integer priority;

    private String assignedTo;

    private String assignmentGroup;

    /** Username of the BTB Tech Lead (user with role TECH_LEAD). Assignable once all approvals are done. */
    private String btbTechLeadUsername;

    private String rootCause;

    private String workaround;

    private String permanentFix;

    private String confluenceLink;
}
