package com.enterprise.fast.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewScheduleEntryResponse {
    private Long id;
    private String timeSlot;
    private String businessFunction;
    private String applicationsUsed;
    private String processImprovements;
    private String techIssuesToResolve;
    private String ticketRaised;
}
