package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.entity.FastProblemLink;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.ExternalLinkType;
import com.enterprise.fast.domain.enums.RagStatus;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.dto.response.DashboardMetricsResponse;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.mapper.FastProblemMapper;
import com.enterprise.fast.repository.FastProblemLinkRepository;
import com.enterprise.fast.repository.FastProblemRegionRepository;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.FastProblemSpecification;
import com.enterprise.fast.repository.KnowledgeArticleRepository;
import com.enterprise.fast.service.DashboardService;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.enterprise.fast.domain.enums.TicketStatus.ACCEPTED;
import static com.enterprise.fast.domain.enums.TicketStatus.ASSIGNED;
import static com.enterprise.fast.domain.enums.TicketStatus.BACKLOG;
import static com.enterprise.fast.domain.enums.TicketStatus.CLOSED;
import static com.enterprise.fast.domain.enums.TicketStatus.FIX_IN_PROGRESS;
import static com.enterprise.fast.domain.enums.TicketStatus.IN_PROGRESS;
import static com.enterprise.fast.domain.enums.TicketStatus.RESOLVED;
import static com.enterprise.fast.domain.enums.TicketStatus.ROOT_CAUSE_IDENTIFIED;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final FastProblemRepository problemRepository;
    private final FastProblemLinkRepository linkRepository;
    private final FastProblemRegionRepository problemRegionRepository;
    private final KnowledgeArticleRepository articleRepository;
    private final FastProblemMapper fastProblemMapper;

    private static final Set<TicketStatus> OPEN_STATUSES = Set.of(
            BACKLOG, ASSIGNED, ACCEPTED, IN_PROGRESS, ROOT_CAUSE_IDENTIFIED, FIX_IN_PROGRESS);
    private static final List<TicketStatus> OPEN_STATUS_LIST = List.of(
            BACKLOG, ASSIGNED, ACCEPTED, IN_PROGRESS, ROOT_CAUSE_IDENTIFIED, FIX_IN_PROGRESS);
    private static final List<TicketStatus> BACKLOG_STATUS_LIST = List.of(BACKLOG, ASSIGNED);
    private static final List<TicketStatus> RESOLVED_STATUS_LIST = List.of(RESOLVED, CLOSED);
    private static final int RESOLVED_PAGE_SIZE = 1000;

    @Override
    public DashboardMetricsResponse getOverallMetrics(String region, String application, String period) {
        LocalDate periodFrom = null;
        LocalDate periodTo = LocalDate.now();
        if (period != null && !period.isBlank()) {
            if ("weekly".equalsIgnoreCase(period)) {
                periodFrom = periodTo.minusDays(7);
            } else if ("monthly".equalsIgnoreCase(period)) {
                periodFrom = periodTo.minusDays(30);
            }
        }

        boolean hasFilter = (region != null && !region.isBlank()) || (application != null && !application.isBlank());
        if (!hasFilter && periodFrom == null) {
            return getOverallMetricsUnfiltered();
        }

        Specification<FastProblem> baseSpec = periodFrom != null
                ? FastProblemSpecification.withFilters(null, region, null, application, periodFrom, periodTo, null, null, null)
                : FastProblemSpecification.withFilters(null, region, null, application, null, null, null);

        long totalOpen;
        long totalResolved;
        long totalClosed;
        if (periodFrom != null) {
            totalOpen = problemRepository.count(baseSpec.and((root, q, cb) -> root.get("status").in(OPEN_STATUSES)));
            Specification<FastProblem> resolvedSpec = FastProblemSpecification.withFilters(null, region, null, application, null, null, periodFrom, periodTo, null);
            totalResolved = problemRepository.count(resolvedSpec.and((root, q, cb) -> cb.equal(root.get("status"), RESOLVED)));
            totalClosed = problemRepository.count(resolvedSpec.and((root, q, cb) -> cb.equal(root.get("status"), CLOSED)));
        } else {
            totalOpen = problemRepository.count(baseSpec.and((root, q, cb) -> root.get("status").in(OPEN_STATUSES)));
            totalResolved = problemRepository.count(baseSpec.and((root, q, cb) -> cb.equal(root.get("status"), RESOLVED)));
            totalClosed = problemRepository.count(baseSpec.and((root, q, cb) -> cb.equal(root.get("status"), CLOSED)));
        }

        Specification<FastProblem> resolvedListSpec = periodFrom != null
                ? FastProblemSpecification.withFilters(null, region, null, application, null, null, periodFrom, periodTo, null)
                        .and((root, q, cb) -> root.get("status").in(RESOLVED_STATUS_LIST))
                : baseSpec.and((root, q, cb) -> root.get("status").in(RESOLVED_STATUS_LIST));
        ResolvedMetrics resolvedMetrics = computeResolvedMetrics(resolvedListSpec);

        Specification<FastProblem> archivedSpec = periodFrom != null
                ? FastProblemSpecification.withFilters(null, region, null, application, periodFrom, periodTo, null, null, "ARCHIVED", null, null, null, null, null)
                : FastProblemSpecification.withFilters(null, region, null, application, null, null, null, null, "ARCHIVED", null, null, null, null, null);

        long totalArchived = problemRepository.count(archivedSpec);
        return DashboardMetricsResponse.builder()
                .totalOpenTickets(totalOpen)
                .totalResolvedTickets(totalResolved)
                .totalClosedTickets(totalClosed)
                .totalArchivedTickets(totalArchived)
                .averageResolutionTimeHours(resolvedMetrics.averageResolutionTimeHours)
                .slaCompliancePercentage(resolvedMetrics.slaCompliancePercentage)
                .ticketsByClassification(getTicketsByClassificationWithSpec(baseSpec))
                .ticketsByRag(getTicketsByRagWithSpec(baseSpec))
                .ticketsByRegion(getTicketsByRegionWithSpec(baseSpec))
                .ticketsByStatus(getTicketsByStatusWithSpec(baseSpec, archivedSpec))
                .avgResolutionByRegion(resolvedMetrics.avgResolutionByRegion)
                .agingDistribution(getAgingDistributionWithSpec(baseSpec))
                .build();
    }

    private DashboardMetricsResponse getOverallMetricsUnfiltered() {
        long totalOpen = problemRepository.countByStatus(TicketStatus.BACKLOG)
                + problemRepository.countByStatus(TicketStatus.ASSIGNED)
                + problemRepository.countByStatus(TicketStatus.ACCEPTED)
                + problemRepository.countByStatus(TicketStatus.IN_PROGRESS)
                + problemRepository.countByStatus(TicketStatus.ROOT_CAUSE_IDENTIFIED)
                + problemRepository.countByStatus(TicketStatus.FIX_IN_PROGRESS);
        long totalResolved = problemRepository.countByStatus(TicketStatus.RESOLVED);
        long totalClosed = problemRepository.countByStatus(TicketStatus.CLOSED);

        long totalArchived = problemRepository.countArchived();
        ResolvedMetrics resolvedMetrics = computeResolvedMetrics(resolvedSpecAll());
        return DashboardMetricsResponse.builder()
                .totalOpenTickets(totalOpen)
                .totalResolvedTickets(totalResolved)
                .totalClosedTickets(totalClosed)
                .totalArchivedTickets(totalArchived)
                .averageResolutionTimeHours(resolvedMetrics.averageResolutionTimeHours)
                .slaCompliancePercentage(resolvedMetrics.slaCompliancePercentage)
                .ticketsByClassification(getTicketsByClassification())
                .ticketsByRag(getTicketsByRag())
                .ticketsByRegion(getTicketsByRegion())
                .ticketsByStatus(getTicketsByStatus())
                .avgResolutionByRegion(resolvedMetrics.avgResolutionByRegion)
                .agingDistribution(getAgingDistribution())
                .build();
    }

    @Override
    public Map<String, Double> getResolutionTimeByRegion() {
        return computeResolvedMetrics(resolvedSpecAll()).avgResolutionByRegion;
    }

    @Override
    public Map<String, Long> getTicketsByClassification() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Classification cls : Classification.values()) {
            result.put(cls.name(), problemRepository.countByClassification(cls));
        }
        return result;
    }

    private Map<String, Long> getTicketsByRag() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (RagStatus rag : RagStatus.values()) {
            result.put(rag.name(), problemRepository.countByRagStatus(rag));
        }
        return result;
    }

    @Override
    public List<FastProblemResponse> getInProgressWithoutRecentComment() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        return problemRepository.findInProgressWithoutRecentComment(IN_PROGRESS, cutoff).stream()
                .map(fastProblemMapper::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FastProblemResponse> getTop10(String region) {
        PageRequest page = PageRequest.of(0, 10);
        List<FastProblem> results;
        if (region != null && !region.isBlank()) {
            RegionalCode rc;
            try {
                rc = RegionalCode.valueOf(region.toUpperCase());
            } catch (IllegalArgumentException e) {
                return List.of();
            }
            results = problemRepository.findTopOpenTicketsByRegion(OPEN_STATUS_LIST, rc, page).getContent();
        } else {
            results = problemRepository.findTopOpenTickets(OPEN_STATUS_LIST, page).getContent();
        }
        return results.stream().map(fastProblemMapper::toSummaryResponse).collect(Collectors.toList());
    }

    @Override
    public PagedResponse<FastProblemResponse> getBacklog(String region, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 500));
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by("createdDate").descending());
        Page<FastProblem> results;
        if (region != null && !region.isBlank()) {
            RegionalCode rc;
            try {
                rc = RegionalCode.valueOf(region.toUpperCase());
            } catch (IllegalArgumentException e) {
                return emptyPage(safePage, safeSize);
            }
            results = problemRepository.findBacklogTicketsByRegion(BACKLOG_STATUS_LIST, rc, pageable);
        } else {
            results = problemRepository.findBacklogTickets(BACKLOG_STATUS_LIST, pageable);
        }
        return toPagedResponse(results);
    }

    @Override
    public List<FastProblemResponse> getUpstream(String linkType) {
        List<ExternalLinkType> types = linkType != null && !linkType.isBlank()
                ? (linkType.equalsIgnoreCase("JIRA") ? List.of(ExternalLinkType.JIRA)
                : linkType.equalsIgnoreCase("SERVICEFIRST") ? List.of(ExternalLinkType.SERVICEFIRST)
                : List.of(ExternalLinkType.JIRA, ExternalLinkType.SERVICEFIRST))
                : List.of(ExternalLinkType.JIRA, ExternalLinkType.SERVICEFIRST);
        List<FastProblem> upstream = problemRepository.findByLinksLinkTypeInAndDeletedFalse(types);
        upstream.sort(Comparator.comparing(FastProblem::getUpdatedDate, Comparator.nullsLast(Comparator.reverseOrder())));
        if (upstream.isEmpty()) return List.of();
        List<Long> problemIds = upstream.stream().map(FastProblem::getId).toList();
        List<FastProblemLink> allLinks = linkRepository.findByFastProblem_IdInOrderByFastProblemIdAscIdAsc(problemIds);
        Map<Long, List<FastProblemLink>> linksByProblemId = allLinks.stream()
                .collect(Collectors.groupingBy(l -> l.getFastProblem().getId()));
        upstream.forEach(fp -> fp.setLinks(linksByProblemId.getOrDefault(fp.getId(), List.of())));
        return upstream.stream().map(fastProblemMapper::toSummaryResponse).collect(Collectors.toList());
    }

    @Override
    public Double getSlaCompliancePercentage() {
        return computeResolvedMetrics(resolvedSpecAll()).slaCompliancePercentage;
    }

    /** Resolution end time: resolvedDate when set, otherwise updatedDate (so RESOLVED/CLOSED without resolvedDate still get a time). */
    private static LocalDateTime resolutionEndTime(FastProblem fp) {
        return fp.getResolvedDate() != null ? fp.getResolvedDate() : fp.getUpdatedDate();
    }

    /** SLA start: from when status moved to IN_PROGRESS; fallback to createdDate for older tickets without in_progress_date. */
    private static LocalDateTime resolutionStartTime(FastProblem fp) {
        return fp.getInProgressDate() != null ? fp.getInProgressDate() : fp.getCreatedDate();
    }

    private ResolvedMetrics computeResolvedMetrics(Specification<FastProblem> resolvedSpec) {
        double totalHours = 0.0;
        int counted = 0;
        int withinSla = 0;
        int withTarget = 0;

        Map<String, double[]> byRegion = new LinkedHashMap<>();
        for (RegionalCode r : RegionalCode.values()) {
            byRegion.put(r.name(), new double[]{0.0, 0.0});
        }

        int page = 0;
        Page<FastProblem> batch;
        do {
            batch = problemRepository.findAll(resolvedSpec, PageRequest.of(page, RESOLVED_PAGE_SIZE, Sort.by("id")));
            for (FastProblem fp : batch.getContent()) {
                LocalDateTime start = resolutionStartTime(fp);
                LocalDateTime end = resolutionEndTime(fp);
                if (start == null || end == null) {
                    continue;
                }
                double hours = Duration.between(start, end).toMinutes() / 60.0;
                totalHours += hours;
                counted++;
                if (fp.getTargetResolutionHours() != null) {
                    if (hours <= fp.getTargetResolutionHours()) {
                        withinSla++;
                    }
                    withTarget++;
                }
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
            page++;
        } while (batch.hasNext());

        Double avgResolution = counted == 0 ? null : totalHours / counted;
        Double slaCompliance = withTarget == 0 ? null : (double) withinSla / withTarget * 100.0;
        Map<String, Double> avgByRegion = new LinkedHashMap<>();
        byRegion.forEach((name, pair) -> avgByRegion.put(name, pair[1] > 0 ? pair[0] / pair[1] : 0.0));

        return new ResolvedMetrics(avgResolution, slaCompliance, avgByRegion);
    }

    private Specification<FastProblem> resolvedSpecAll() {
        return FastProblemSpecification.withFilters(null, null, null, null, null, null, null, null, null)
                .and((root, q, cb) -> root.get("status").in(RESOLVED_STATUS_LIST));
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
            long count = status == TicketStatus.ARCHIVED
                    ? problemRepository.countArchived()
                    : problemRepository.countByStatus(status);
            result.put(status.name(), count);
        }
        return result;
    }

    private static final class ResolvedMetrics {
        private final Double averageResolutionTimeHours;
        private final Double slaCompliancePercentage;
        private final Map<String, Double> avgResolutionByRegion;

        private ResolvedMetrics(Double averageResolutionTimeHours,
                                Double slaCompliancePercentage,
                                Map<String, Double> avgResolutionByRegion) {
            this.averageResolutionTimeHours = averageResolutionTimeHours;
            this.slaCompliancePercentage = slaCompliancePercentage;
            this.avgResolutionByRegion = avgResolutionByRegion;
        }
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

    private Map<String, Long> getTicketsByRagWithSpec(Specification<FastProblem> baseSpec) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (RagStatus rag : RagStatus.values()) {
            long count = problemRepository.count(baseSpec.and((root, q, cb) ->
                    cb.equal(root.get("ragStatus"), rag)));
            result.put(rag.name(), count);
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

    private Map<String, Long> getTicketsByStatusWithSpec(Specification<FastProblem> baseSpec, Specification<FastProblem> archivedSpec) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (TicketStatus status : TicketStatus.values()) {
            long count = status == TicketStatus.ARCHIVED && archivedSpec != null
                    ? problemRepository.count(archivedSpec)
                    : problemRepository.count(baseSpec.and((root, q, cb) -> cb.equal(root.get("status"), status)));
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

    private PagedResponse<FastProblemResponse> toPagedResponse(Page<FastProblem> page) {
        return PagedResponse.<FastProblemResponse>builder()
                .content(page.getContent().stream().map(fastProblemMapper::toSummaryResponse).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private PagedResponse<FastProblemResponse> emptyPage(int page, int size) {
        return PagedResponse.<FastProblemResponse>builder()
                .content(List.of())
                .page(page)
                .size(size)
                .totalElements(0)
                .totalPages(0)
                .last(true)
                .build();
    }
}
