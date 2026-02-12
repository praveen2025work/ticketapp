package com.enterprise.fast.service;

import com.enterprise.fast.dto.response.DashboardMetricsResponse;

import java.util.Map;

public interface DashboardService {

    /**
     * Get dashboard metrics, optionally filtered by region and/or application.
     * @param region optional region code (e.g. AMER, EMEA, APAC)
     * @param application optional application name (matches affectedApplication)
     */
    DashboardMetricsResponse getOverallMetrics(String region, String application);

    Map<String, Double> getResolutionTimeByRegion();

    Map<String, Long> getTicketsByClassification();

    Double getSlaCompliancePercentage();

    Map<String, Long> getAgingDistribution();
}
