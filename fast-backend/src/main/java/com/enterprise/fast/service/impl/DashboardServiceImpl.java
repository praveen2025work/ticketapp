package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.dto.response.DashboardMetricsResponse;
import com.enterprise.fast.repository.FastProblemRegionRepository;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.FastProblemSpecification;
import com.enterprise.fast.repository.KnowledgeArticleRepository;
import com.enterprise.fast.service.DashboardService;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.enterprise.fast.domain.enums.TicketStatus.CLOSED;
import static com.enterprise.fast.domain.enums.TicketStatus.RESOLVED;
import static com.enterprise.fast.domain.enums.TicketStatus.ASSIGNED;
import static com.enterprise.fast.domain.enums.TicketStatus.FIX_IN_PROGRESS;
import static com.enterprise.fast.domain.enums.TicketStatus.IN_PROGRESS;
import static com.enterprise.fast.domain.enums.TicketStatus.NEW;
import static com.enterprise.fast.domain.enums.TicketStatus.ROOT_CAUSE_IDENTIFIED;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final FastProblemRepository problemRepository;
    private final FastProblemRegionRepository problemRegionRepository;
    private final KnowledgeArticleRepository articleRepository;

    private static final Set<TicketStatus> OPEN_STATUSES = Set.of(
            NEW, ASSIGNED, IN_PROGRESS, ROOT_CAUSE_IDENTIFIED, FIX_IN_PROGRESS);

    @Override
    public DashboardMetricsResponse getOverallMetrics(String region, String application) {
        boolean hasFilter = (region != null && !region.isBlank()) || (application != null && !application.isBlank());
        if (!hasFilter) {
            return getOverallMetricsUnfiltered();
        }
        Specification<FastProblem> baseSpec = FastProblemSpecification.withFilters(
                null, region, null, application, null, null, null);

        long totalOpen = problemRepository.count(baseSpec.and((root, q, cb) ->
                root.get("status").in(OPEN_STATUSES)));
        long totalResolved = problemRepository.count(baseSpec.and((root, q, cb) ->
                cb.equal(root.get("status"), RESOLVED)));
        long totalClosed = problemRepository.count(baseSpec.and((root, q, cb) ->
                cb.equal(root.get("status"), CLOSED)));

        List<FastProblem> resolvedList = problemRepository.findAll(
                baseSpec.and((root, q, cb) -> root.get("status").in(List.of(RESOLVED, CLOSED))),
                PageRequest.of(0, 50_000)).getContent();

        return DashboardMetricsResponse.builder()
                .totalOpenTickets(totalOpen)
                .totalResolvedTickets(totalResolved)
                .totalClosedTickets(totalClosed)
                .averageResolutionTimeHours(computeAverageResolutionTimeHoursFromList(resolvedList))
                .slaCompliancePercentage(computeSlaCompliancePercentageFromList(resolvedList))
                .ticketsByClassification(getTicketsByClassificationWithSpec(baseSpec))
                .ticketsByRegion(getTicketsByRegionWithSpec(baseSpec))
                .ticketsByStatus(getTicketsByStatusWithSpec(baseSpec))
                .avgResolutionByRegion(computeResolutionTimeByRegionFromList(resolvedList))
                .agingDistribution(getAgingDistributionWithSpec(baseSpec))
                .build();
    }

    private DashboardMetricsResponse getOverallMetricsUnfiltered() {
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
                .averageResolutionTimeHours(computeAverageResolutionTimeHours())
                .slaCompliancePercentage(computeSlaCompliancePercentage())
                .ticketsByClassification(getTicketsByClassification())
                .ticketsByRegion(getTicketsByRegion())
                .ticketsByStatus(getTicketsByStatus())
                .avgResolutionByRegion(computeResolutionTimeByRegion())
                .agingDistribution(getAgingDistribution())
                .build();
    }

    @Override
    public Map<String, Double> getResolutionTimeByRegion() {
        return computeResolutionTimeByRegion();
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
        return computeSlaCompliancePercentage();
    }

    /** Resolution end time: resolvedDate when set, otherwise updatedDate (so RESOLVED/CLOSED without resolvedDate still get a time). */
    private static LocalDateTime resolutionEndTime(FastProblem fp) {
        return fp.getResolvedDate() != null ? fp.getResolvedDate() : fp.getUpdatedDate();
    }

    /** DB-agnostic: compute average resolution time in hours from resolved/closed tickets (works on H2, MySQL, Oracle). */
    private Double computeAverageResolutionTimeHours() {
        List<FastProblem> resolved = problemRepository.findResolvedForMetrics(List.of(RESOLVED, CLOSED));
        if (resolved.isEmpty()) return null;
        double totalHours = 0;
        int counted = 0;
        for (FastProblem fp : resolved) {
            LocalDateTime created = fp.getCreatedDate();
            LocalDateTime end = resolutionEndTime(fp);
            if (created != null && end != null) {
                totalHours += Duration.between(created, end).toMinutes() / 60.0;
                counted++;
            }
        }
        return counted == 0 ? null : totalHours / counted;
    }

    /** DB-agnostic: compute SLA compliance % (resolved within target hours). Target: 80%. */
    private Double computeSlaCompliancePercentage() {
        List<FastProblem> resolved = problemRepository.findResolvedForMetrics(List.of(RESOLVED, CLOSED));
        if (resolved.isEmpty()) return null; // N/A when no resolved tickets
        int withinSla = 0;
        int withTarget = 0;
        for (FastProblem fp : resolved) {
            LocalDateTime created = fp.getCreatedDate();
            LocalDateTime end = resolutionEndTime(fp);
            if (created != null && end != null && fp.getTargetResolutionHours() != null) {
                double hours = Duration.between(created, end).toMinutes() / 60.0;
                if (hours <= fp.getTargetResolutionHours()) withinSla++;
                withTarget++;
            }
        }
        return withTarget == 0 ? null : (double) withinSla / withTarget * 100.0;
    }

    /** DB-agnostic: average resolution time by region (from resolved/closed tickets with regions). */
    private Map<String, Double> computeResolutionTimeByRegion() {
        Map<String, Double> result = new LinkedHashMap<>();
        for (RegionalCode region : RegionalCode.values()) {
            result.put(region.name(), 0.0);
        }
        List<FastProblem> resolved = problemRepository.findResolvedForMetrics(List.of(RESOLVED, CLOSED));
        Map<String, double[]> byRegion = new LinkedHashMap<>(); // region -> [sumHours, count]
        for (RegionalCode r : RegionalCode.values()) {
            byRegion.put(r.name(), new double[]{0.0, 0.0});
        }
        for (FastProblem fp : resolved) {
            LocalDateTime created = fp.getCreatedDate();
            LocalDateTime end = resolutionEndTime(fp);
            if (created == null || end == null) continue;
            double hours = Duration.between(created, end).toMinutes() / 60.0;
            if (fp.getRegions() != null && !fp.getRegions().isEmpty()) {
                fp.getRegions().forEach(pr -> {
                    String name = pr.getRegionalCode().name();
                    double[] pair = byRegion.get(name);
                    if (pair != null) {
                        pair[0] += hours;
                        pair[1] += 1;
                    }
                });
            }
        }
        byRegion.forEach((name, pair) -> result.put(name, pair[1] > 0 ? pair[0] / pair[1] : 0.0));
        return result;
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

    private Double computeAverageResolutionTimeHoursFromList(List<FastProblem> resolvedList) {
        if (resolvedList.isEmpty()) return null;
        double totalHours = 0;
        int counted = 0;
        for (FastProblem fp : resolvedList) {
            LocalDateTime created = fp.getCreatedDate();
            LocalDateTime end = resolutionEndTime(fp);
            if (created != null && end != null) {
                totalHours += Duration.between(created, end).toMinutes() / 60.0;
                counted++;
            }
        }
        return counted == 0 ? null : totalHours / counted;
    }

    private Double computeSlaCompliancePercentageFromList(List<FastProblem> resolvedList) {
        if (resolvedList.isEmpty()) return null;
        int withinSla = 0;
        int withTarget = 0;
        for (FastProblem fp : resolvedList) {
            LocalDateTime created = fp.getCreatedDate();
            LocalDateTime end = resolutionEndTime(fp);
            if (created != null && end != null && fp.getTargetResolutionHours() != null) {
                double hours = Duration.between(created, end).toMinutes() / 60.0;
                if (hours <= fp.getTargetResolutionHours()) withinSla++;
                withTarget++;
            }
        }
        return withTarget == 0 ? null : (double) withinSla / withTarget * 100.0;
    }

    private Map<String, Double> computeResolutionTimeByRegionFromList(List<FastProblem> resolvedList) {
        Map<String, Double> result = new LinkedHashMap<>();
        for (RegionalCode r : RegionalCode.values()) {
            result.put(r.name(), 0.0);
        }
        Map<String, double[]> byRegion = new LinkedHashMap<>();
        for (RegionalCode r : RegionalCode.values()) {
            byRegion.put(r.name(), new double[]{0.0, 0.0});
        }
        for (FastProblem fp : resolvedList) {
            LocalDateTime created = fp.getCreatedDate();
            LocalDateTime end = resolutionEndTime(fp);
            if (created == null || end == null) continue;
            double hours = Duration.between(created, end).toMinutes() / 60.0;
            if (fp.getRegions() != null && !fp.getRegions().isEmpty()) {
                fp.getRegions().forEach(pr -> {
                    String name = pr.getRegionalCode().name();
                    double[] pair = byRegion.get(name);
                    if (pair != null) {
                        pair[0] += hours;
                        pair[1] += 1;
                    }
                });
            }
        }
        byRegion.forEach((name, pair) -> result.put(name, pair[1] > 0 ? pair[0] / pair[1] : 0.0));
        return result;
    }

    private Map<String, Long> getTicketsByClassificationWithSpec(Specification<FastProblem> baseSpec) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Classification cls : Classification.values()) {
            long count = problemRepository.count(baseSpec.and((root, q, cb) ->
                    cb.equal(root.get("classification"), cls)));
            result.put(cls.name(), count);
        }
        return result;
    }

    private Map<String, Long> getTicketsByRegionWithSpec(Specification<FastProblem> baseSpec) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (RegionalCode rc : RegionalCode.values()) {
            Specification<FastProblem> withRegion = baseSpec.and((root, query, cb) -> {
                var regionJoin = root.join("regions", JoinType.INNER);
                return cb.equal(regionJoin.get("regionalCode"), rc);
            });
            result.put(rc.name(), problemRepository.count(withRegion));
        }
        return result;
    }

    private Map<String, Long> getTicketsByStatusWithSpec(Specification<FastProblem> baseSpec) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (TicketStatus status : TicketStatus.values()) {
            long count = problemRepository.count(baseSpec.and((root, q, cb) ->
                    cb.equal(root.get("status"), status)));
            result.put(status.name(), count);
        }
        return result;
    }

    private Map<String, Long> getAgingDistributionWithSpec(Specification<FastProblem> baseSpec) {
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("A (<10 days)", problemRepository.count(baseSpec.and((root, q, cb) ->
                cb.equal(root.get("classification"), Classification.A))));
        result.put("R (10-20 days)", problemRepository.count(baseSpec.and((root, q, cb) ->
                cb.equal(root.get("classification"), Classification.R))));
        result.put("P (>20 days)", problemRepository.count(baseSpec.and((root, q, cb) ->
                cb.equal(root.get("classification"), Classification.P))));
        return result;
    }
}
