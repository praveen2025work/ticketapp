package com.enterprise.fast.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewScheduleResponse {
    private Long id;
    private String businessArea;
    private String pcDirector;
    private String productController;
    private String namedPnls;
    private String location;
    private String interviewedBy;
    private LocalDate interviewDate;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private List<InterviewScheduleEntryResponse> entries;
}
