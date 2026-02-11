package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.dto.response.DashboardMetricsResponse;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.KnowledgeArticleRepository;
import com.enterprise.fast.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final FastProblemRepository problemRepository;
    private final KnowledgeArticleRepository articleRepository;

    @Override
    public DashboardMetricsResponse getOverallMetrics() {
        long totalOpen = problemRepository.countByStatus(TicketStatus.NEW)
                + problemRepository.countByStatus(TicketStatus.ASSIGNED)
                + problemRepository.countByStatus(TicketStatus.IN_PROGRESS)
                + problemRepository.countByStatus(TicketStatus.ROOT_CAUSE_IDENTIFIED)
                + problemRepository.countByStatus(TicketStatus.FIX_IN_PROGRESS);

        long totalResolved = problemRepository.countByStatus(TicketStatus.RESOLVED);
        long totalClosed = problemRepository.countByStatus(TicketStatus.CLOSED);

        return DashboardMetricsResponse.builder()
                .totalOpenTickets(totalOpen)
                .totalResolvedTickets(totalResolved)
                .totalClosedTickets(totalClosed)
                .averageResolutionTimeHours(problemRepository.findAverageResolutionTimeHours())
                .slaCompliancePercentage(getSlaCompliancePercentage())
                .ticketsByClassification(getTicketsByClassification())
                .ticketsByRegion(getTicketsByRegion())
                .ticketsByStatus(getTicketsByStatus())
                .avgResolutionByRegion(getResolutionTimeByRegion())
                .agingDistribution(getAgingDistribution())
                .build();
    }

    @Override
    public Map<String, Double> getResolutionTimeByRegion() {
        Map<String, Double> result = new LinkedHashMap<>();
        for (RegionalCode region : RegionalCode.values()) {
            Double avg = problemRepository.findAverageResolutionTimeByRegion(region);
            result.put(region.name(), avg != null ? avg : 0.0);
        }
        return result;
    }

    @Override
    public Map<String, Long> getTicketsByClassification() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Classification cls : Classification.values()) {
            result.put(cls.name(), problemRepository.countByClassification(cls));
        }
        return result;
    }

    @Override
    public Double getSlaCompliancePercentage() {
        long resolved = problemRepository.countResolved();
        if (resolved == 0) return 100.0;
        long withinSla = problemRepository.countWithinSla();
        return (double) withinSla / resolved * 100.0;
    }

    @Override
    public Map<String, Long> getAgingDistribution() {
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("A (<10 days)", problemRepository.countByClassification(Classification.A));
        result.put("R (10-20 days)", problemRepository.countByClassification(Classification.R));
        result.put("P (>20 days)", problemRepository.countByClassification(Classification.P));
        return result;
    }

    private Map<String, Long> getTicketsByRegion() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (RegionalCode region : RegionalCode.values()) {
            result.put(region.name(), problemRepository.countByRegionalCode(region));
        }
        return result;
    }

    private Map<String, Long> getTicketsByStatus() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (TicketStatus status : TicketStatus.values()) {
            result.put(status.name(), problemRepository.countByStatus(status));
        }
        return result;
    }
}
