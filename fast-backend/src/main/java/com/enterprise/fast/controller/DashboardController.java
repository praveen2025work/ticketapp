package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.DashboardMetricsResponse;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Metrics and KPI endpoints")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    @Operation(summary = "Get overall dashboard metrics (optionally filtered by region, application, period=weekly|monthly)")
    public ResponseEntity<DashboardMetricsResponse> getMetrics(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String application,
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(dashboardService.getOverallMetrics(region, application, period));
    }

    @GetMapping("/in-progress-without-daily-comment")
    @Operation(summary = "In Progress tickets with no comment in the last 24 hours (daily commentary required)")
    public ResponseEntity<List<FastProblemResponse>> getInProgressWithoutRecentComment() {
        return ResponseEntity.ok(dashboardService.getInProgressWithoutRecentComment());
    }

    @GetMapping("/top10")
    @Operation(summary = "Top 10 Finance Daily Production issues by impact (optional region filter)")
    public ResponseEntity<List<FastProblemResponse>> getTop10(
            @RequestParam(required = false) String region) {
        return ResponseEntity.ok(dashboardService.getTop10(region));
    }

    @GetMapping("/backlog")
    @Operation(summary = "Backlog items (NEW, ASSIGNED) for bi-weekly review; optional region filter")
    public ResponseEntity<List<FastProblemResponse>> getBacklog(
            @RequestParam(required = false) String region) {
        return ResponseEntity.ok(dashboardService.getBacklog(region));
    }

    @GetMapping("/upstream")
    @Operation(summary = "Upstream items: tickets with JIRA or ServiceFirst links; optional linkType filter (JIRA, SERVICEFIRST)")
    public ResponseEntity<List<FastProblemResponse>> getUpstream(
            @RequestParam(required = false) String linkType) {
        return ResponseEntity.ok(dashboardService.getUpstream(linkType));
    }

    @GetMapping("/metrics/region")
    @Operation(summary = "Get average resolution time by region")
    public ResponseEntity<Map<String, Double>> getResolutionTimeByRegion() {
        return ResponseEntity.ok(dashboardService.getResolutionTimeByRegion());
    }

    @GetMapping("/metrics/classification")
    @Operation(summary = "Get ticket count by classification (A/R/P)")
    public ResponseEntity<Map<String, Long>> getTicketsByClassification() {
        return ResponseEntity.ok(dashboardService.getTicketsByClassification());
    }

    @GetMapping("/metrics/sla-compliance")
    @Operation(summary = "Get SLA compliance percentage")
    public ResponseEntity<Map<String, Double>> getSlaCompliance() {
        return ResponseEntity.ok(Collections.singletonMap("slaCompliancePercentage", dashboardService.getSlaCompliancePercentage()));
    }

    @GetMapping("/metrics/aging")
    @Operation(summary = "Get ticket aging distribution")
    public ResponseEntity<Map<String, Long>> getAgingDistribution() {
        return ResponseEntity.ok(dashboardService.getAgingDistribution());
    }
}
