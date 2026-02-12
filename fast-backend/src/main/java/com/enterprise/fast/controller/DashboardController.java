package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.DashboardMetricsResponse;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Metrics and KPI endpoints")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    @Operation(summary = "Get overall dashboard metrics (optionally filtered by region and application)")
    public ResponseEntity<DashboardMetricsResponse> getMetrics(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String application) {
        return ResponseEntity.ok(dashboardService.getOverallMetrics(region, application));
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
