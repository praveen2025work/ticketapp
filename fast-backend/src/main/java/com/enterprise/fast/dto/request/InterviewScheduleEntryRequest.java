package com.enterprise.fast.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewScheduleEntryRequest {

    @Pattern(regexp = "^([01]\\d|2[0-3]):00$", message = "timeSlot must be in HH:00 format")
    private String timeSlot;

    @Size(max = 2000, message = "businessFunction must be less than 2000 characters")
    private String businessFunction;

    @Size(max = 1000, message = "applicationsUsed must be less than 1000 characters")
    private String applicationsUsed;

    @Size(max = 2000, message = "processImprovements must be less than 2000 characters")
    private String processImprovements;

    @Size(max = 2000, message = "techIssuesToResolve must be less than 2000 characters")
    private String techIssuesToResolve;

    @Size(max = 500, message = "ticketRaised must be less than 500 characters")
    private String ticketRaised;
}
