package com.enterprise.fast.service;

import com.enterprise.fast.dto.response.DashboardMetricsResponse;

import java.util.Map;

public interface DashboardService {

    DashboardMetricsResponse getOverallMetrics();

    Map<String, Double> getResolutionTimeByRegion();

    Map<String, Long> getTicketsByClassification();

    Double getSlaCompliancePercentage();

    Map<String, Long> getAgingDistribution();
}
