package com.enterprise.fast.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewScheduleRequest {

    @Size(max = 150, message = "businessArea must be less than 150 characters")
    private String businessArea;

    @Size(max = 150, message = "pcDirector must be less than 150 characters")
    private String pcDirector;

    @Size(max = 150, message = "productController must be less than 150 characters")
    private String productController;

    @Size(max = 500, message = "namedPnls must be less than 500 characters")
    private String namedPnls;

    @Size(max = 150, message = "location must be less than 150 characters")
    private String location;

    @Size(max = 150, message = "interviewedBy must be less than 150 characters")
    private String interviewedBy;

    @NotNull(message = "interviewDate is required")
    private LocalDate interviewDate;

    @NotEmpty(message = "entries are required")
    @Valid
    private List<InterviewScheduleEntryRequest> entries;
}
