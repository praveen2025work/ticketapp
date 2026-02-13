package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.DashboardMetricsResponse;
import com.enterprise.fast.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private DashboardController controller;

    @Test
    void getMetrics_ReturnsOk() {
        DashboardMetricsResponse metrics = DashboardMetricsResponse.builder()
                .totalOpenTickets(10L)
                .slaCompliancePercentage(95.0)
                .build();
        when(dashboardService.getOverallMetrics(null, null, null)).thenReturn(metrics);
        ResponseEntity<DashboardMetricsResponse> res = controller.getMetrics(null, null, null);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody().getTotalOpenTickets()).isEqualTo(10L);
        verify(dashboardService).getOverallMetrics(null, null, null);
    }

    @Test
    void getResolutionTimeByRegion_ReturnsOk() {
        when(dashboardService.getResolutionTimeByRegion()).thenReturn(Map.of("AMER", 3.5));
        ResponseEntity<Map<String, Double>> res = controller.getResolutionTimeByRegion();
        assertThat(res.getBody()).containsEntry("AMER", 3.5);
        verify(dashboardService).getResolutionTimeByRegion();
    }

    @Test
    void getTicketsByClassification_ReturnsOk() {
        when(dashboardService.getTicketsByClassification()).thenReturn(Map.of("A", 5L));
        ResponseEntity<Map<String, Long>> res = controller.getTicketsByClassification();
        assertThat(res.getBody()).containsEntry("A", 5L);
        verify(dashboardService).getTicketsByClassification();
    }

    @Test
    void getSlaCompliance_ReturnsOk() {
        when(dashboardService.getSlaCompliancePercentage()).thenReturn(88.5);
        ResponseEntity<Map<String, Double>> res = controller.getSlaCompliance();
        assertThat(res.getBody()).containsEntry("slaCompliancePercentage", 88.5);
        verify(dashboardService).getSlaCompliancePercentage();
    }

    @Test
    void getAgingDistribution_ReturnsOk() {
        when(dashboardService.getAgingDistribution()).thenReturn(Map.of("0-1d", 10L));
        ResponseEntity<Map<String, Long>> res = controller.getAgingDistribution();
        assertThat(res.getBody()).containsEntry("0-1d", 10L);
        verify(dashboardService).getAgingDistribution();
    }
}
