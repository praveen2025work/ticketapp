package com.enterprise.fast.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFastProblemRequest {

    private String servicenowIncidentNumber;

    private String servicenowProblemNumber;

    private String pbtId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @PositiveOrZero(message = "User impact count must be non-negative")
    private Integer userImpactCount;

    private String affectedApplication;

    private String requestNumber;

    private List<Long> applicationIds;

    /** Benefits justification – required for generating FAST ID (Finance Chennai PC & FC). */
    @NotBlank(message = "Benefits justification is required for FAST ID")
    private String anticipatedBenefits;

    @NotEmpty(message = "At least one region is required")
    private List<String> regionalCodes;

    private Integer targetResolutionHours;

    @Min(1) @Max(5)
    private Integer priority;

    private String assignedTo;

    private String assignmentGroup;

    private String confluenceLink;
}
