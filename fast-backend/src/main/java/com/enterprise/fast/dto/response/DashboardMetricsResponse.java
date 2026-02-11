package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardMetricsResponse {

    private long totalOpenTickets;
    private long totalResolvedTickets;
    private long totalClosedTickets;
    private Double averageResolutionTimeHours;
    private Double slaCompliancePercentage;
    private Map<String, Long> ticketsByClassification;
    private Map<String, Long> ticketsByRegion;
    private Map<String, Long> ticketsByStatus;
    private Map<String, Double> avgResolutionByRegion;
    private Map<String, Long> agingDistribution;
}
