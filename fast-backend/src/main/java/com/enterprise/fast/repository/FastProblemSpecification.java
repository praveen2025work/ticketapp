package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RagStatus;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public final class FastProblemSpecification {

    private FastProblemSpecification() {
    }

    /**
     * Normalize application name for matching: lowercase, remove spaces.
     * "Finance Portal" and "finance portal" both become "financeportal"
     */
    private static String normalizeApplication(String app) {
        if (app == null || app.isBlank()) return "";
        return app.toLowerCase().replaceAll("\\s+", "");
    }

    public static Specification<FastProblem> withFilters(String keyword, String regionCode, String classification,
                                                        String application, LocalDate fromDate, LocalDate toDate,
                                                        String statusFilter) {
        return withFilters(keyword, regionCode, classification, application, fromDate, toDate, null, null, statusFilter, null, null, null, null, null);
    }

    /** Same as above with optional resolvedDate range for period metrics (weekly/monthly). */
    public static Specification<FastProblem> withFilters(String keyword, String regionCode, String classification,
                                                        String application, LocalDate fromDate, LocalDate toDate,
                                                        LocalDate resolvedFrom, LocalDate resolvedTo,
                                                        String statusFilter) {
        return withFilters(keyword, regionCode, classification, application, fromDate, toDate, resolvedFrom, resolvedTo, statusFilter, null, null, null, null, null);
    }

    /** Full filters including RAG, Age, Impact, Priority for ticket list. */
    public static Specification<FastProblem> withFilters(String keyword, String regionCode, String classification,
                                                        String application, LocalDate fromDate, LocalDate toDate,
                                                        LocalDate resolvedFrom, LocalDate resolvedTo,
                                                        String statusFilter, String ragStatus, Integer ageMin, Integer ageMax, Integer minImpact, Integer priority) {
        return (root, query, cb) -> {
            if (regionCode != null && !regionCode.isBlank()) {
                query.distinct(true);
            }
            if (application != null && !application.isBlank()) {
                query.distinct(true); // applications join can produce multiple rows per ticket
            }
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            // When filtering by ARCHIVED we include archived tickets; otherwise exclude them
            boolean filterByArchived = "ARCHIVED".equalsIgnoreCase(statusFilter);
            if (!filterByArchived) {
                predicates.add(cb.equal(root.get("archived"), false));
            }

            if (keyword != null && !keyword.isBlank()) {
                String trimmed = keyword.trim();
                if (trimmed.isEmpty()) {
                    // skip empty keyword
                } else {
                    String pattern = "%" + trimmed.toLowerCase() + "%";
                    Predicate keywordPredicate = cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("pbtId"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("servicenowIncidentNumber"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("servicenowProblemNumber"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("affectedApplication"), "")), pattern)
                    );
                    predicates.add(keywordPredicate);
                }
            }

            if (regionCode != null && !regionCode.isBlank()) {
                try {
                    RegionalCode region = RegionalCode.valueOf(regionCode.toUpperCase());
                    var regionJoin = root.join("regions", jakarta.persistence.criteria.JoinType.INNER);
                    predicates.add(cb.equal(regionJoin.get("regionalCode"), region));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (classification != null && !classification.isBlank()) {
                try {
                    Classification cls = Classification.valueOf(classification.toUpperCase());
                    predicates.add(cb.equal(root.get("classification"), cls));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (application != null && !application.isBlank()) {
                String normalized = normalizeApplication(application);
                String appTrimmed = application.trim();
                // Match EITHER affectedApplication (free-text) OR linked applications (many-to-many)
                List<Predicate> appPredicates = new ArrayList<>();
                if (!normalized.isEmpty()) {
                    var appField = root.get("affectedApplication");
                    var coalesced = cb.coalesce(appField, "");
                    var replaced = cb.function("REPLACE", String.class, coalesced, cb.literal(" "), cb.literal(""));
                    var dbNormalized = cb.lower(replaced);
                    appPredicates.add(cb.like(dbNormalized, "%" + normalized + "%"));
                }
                // Match tickets linked to Application by name (dashboard sends application name)
                var appJoin = root.join("applications", JoinType.LEFT);
                appPredicates.add(cb.equal(cb.lower(appJoin.get("name")), appTrimmed.toLowerCase()));
                predicates.add(cb.or(appPredicates.toArray(new Predicate[0])));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdDate"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdDate"), toDate.atTime(23, 59, 59)));
            }
            if (resolvedFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("resolvedDate"), resolvedFrom.atStartOfDay()));
            }
            if (resolvedTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("resolvedDate"), resolvedTo.atTime(23, 59, 59)));
            }

            if (statusFilter != null && !statusFilter.isBlank()) {
                var statusField = root.get("status");
                if ("OPEN".equalsIgnoreCase(statusFilter)) {
                    predicates.add(cb.not(statusField.in(Set.of(TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.REJECTED, TicketStatus.ARCHIVED))));
                } else if ("ARCHIVED".equalsIgnoreCase(statusFilter)) {
                    // Archived: status = ARCHIVED or legacy archived = true
                    predicates.add(cb.or(
                            cb.equal(statusField, TicketStatus.ARCHIVED),
                            cb.equal(root.get("archived"), true)
                    ));
                } else {
                    try {
                        TicketStatus status = TicketStatus.valueOf(statusFilter.toUpperCase());
                        predicates.add(cb.equal(statusField, status));
                    } catch (IllegalArgumentException ignored) {
                    }
                }
            }

            if (ragStatus != null && !ragStatus.isBlank()) {
                try {
                    RagStatus rag = RagStatus.valueOf(ragStatus.toUpperCase());
                    predicates.add(cb.equal(root.get("ragStatus"), rag));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (ageMin != null && ageMin >= 0) {
                predicates.add(cb.greaterThanOrEqualTo(cb.coalesce(root.get("ticketAgeDays"), 0), ageMin));
            }
            if (ageMax != null && ageMax >= 0) {
                predicates.add(cb.lessThanOrEqualTo(cb.coalesce(root.get("ticketAgeDays"), 0), ageMax));
            }
            if (minImpact != null && minImpact >= 0) {
                predicates.add(cb.greaterThanOrEqualTo(cb.coalesce(root.get("userImpactCount"), 0), minImpact));
            }
            if (priority != null && priority >= 1 && priority <= 5) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
