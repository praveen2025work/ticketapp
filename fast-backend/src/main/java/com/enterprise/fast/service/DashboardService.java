package com.enterprise.fast.service;

import com.enterprise.fast.dto.response.DashboardMetricsResponse;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.dto.response.PagedResponse;

import java.util.List;
import java.util.Map;

public interface DashboardService {

    /**
     * Get dashboard metrics, optionally filtered by region and/or application.
     * @param region optional region code (e.g. AMER, EMEA, APAC)
     * @param application optional application name (matches affectedApplication)
     */
    DashboardMetricsResponse getOverallMetrics(String region, String application, String period);

    Map<String, Double> getResolutionTimeByRegion();

    Map<String, Long> getTicketsByClassification();

    Double getSlaCompliancePercentage();

    Map<String, Long> getAgingDistribution();

    /** In Progress tickets with no comment in the last 24 hours (daily commentary required). */
    List<FastProblemResponse> getInProgressWithoutRecentComment();

    /** Top 10 open tickets by impact (RAG R first, then A, then priority/age/impact). Optional region filter for Finance Daily Production. */
    List<FastProblemResponse> getTop10(String region);

    /** Backlog: open tickets not yet In Progress (NEW, ASSIGNED). */
    PagedResponse<FastProblemResponse> getBacklog(String region, int page, int size);

    /** Upstream items: tickets with at least one JIRA or ServiceFirst link. Optional filter by linkType (JIRA, SERVICEFIRST). */
    List<FastProblemResponse> getUpstream(String linkType);
}
