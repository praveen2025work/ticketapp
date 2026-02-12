package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import org.springframework.data.jpa.domain.Specification;

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
        return (root, query, cb) -> {
            if (regionCode != null && !regionCode.isBlank()) {
                query.distinct(true);
            }
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
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
                if (!normalized.isEmpty()) {
                    var appField = root.get("affectedApplication");
                    var coalesced = cb.coalesce(appField, "");
                    var replaced = cb.function("REPLACE", String.class, coalesced, cb.literal(" "), cb.literal(""));
                    var dbNormalized = cb.lower(replaced);
                    predicates.add(cb.like(dbNormalized, "%" + normalized + "%"));
                }
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdDate"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdDate"), toDate.atTime(23, 59, 59)));
            }

            if (statusFilter != null && !statusFilter.isBlank()) {
                var statusField = root.get("status");
                if ("OPEN".equalsIgnoreCase(statusFilter)) {
                    predicates.add(cb.not(statusField.in(Set.of(TicketStatus.RESOLVED, TicketStatus.CLOSED))));
                } else {
                    try {
                        TicketStatus status = TicketStatus.valueOf(statusFilter.toUpperCase());
                        predicates.add(cb.equal(statusField, status));
                    } catch (IllegalArgumentException ignored) {
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
