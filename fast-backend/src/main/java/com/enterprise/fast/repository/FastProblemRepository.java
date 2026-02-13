package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.ExternalLinkType;
import com.enterprise.fast.domain.enums.RagStatus;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FastProblemRepository extends JpaRepository<FastProblem, Long>, JpaSpecificationExecutor<FastProblem> {

    Page<FastProblem> findByDeletedFalse(Pageable pageable);

    Page<FastProblem> findByDeletedFalseAndArchivedFalse(Pageable pageable);

    @EntityGraph(attributePaths = {"comments", "regions"})
    @Query("SELECT fp FROM FastProblem fp WHERE fp.status = :status AND fp.deleted = false")
    List<FastProblem> findByStatusAndDeletedFalseWithComments(@Param("status") TicketStatus status);

    List<FastProblem> findByStatusAndDeletedFalse(TicketStatus status);

    Page<FastProblem> findByRegions_RegionalCodeAndDeletedFalse(RegionalCode regionalCode, Pageable pageable);

    Page<FastProblem> findByRegions_RegionalCodeAndDeletedFalseAndArchivedFalse(RegionalCode regionalCode, Pageable pageable);

    Page<FastProblem> findByClassificationAndDeletedFalse(Classification classification, Pageable pageable);

    Page<FastProblem> findByClassificationAndDeletedFalseAndArchivedFalse(Classification classification, Pageable pageable);

    Page<FastProblem> findByStatusAndDeletedFalse(TicketStatus status, Pageable pageable);

    Page<FastProblem> findByStatusAndDeletedFalseAndArchivedFalse(TicketStatus status, Pageable pageable);

    List<FastProblem> findByStatusNotInAndDeletedFalse(List<TicketStatus> statuses);

    Page<FastProblem> findByStatusNotInAndDeletedFalse(List<TicketStatus> statuses, Pageable pageable);

    /** CLOSED tickets with closedDate older than cutoff; for archiving after 7 days. */
    @Query("SELECT fp FROM FastProblem fp WHERE fp.status = :status AND fp.deleted = false AND fp.archived = false AND fp.closedDate IS NOT NULL AND fp.closedDate <= :cutoff")
    List<FastProblem> findClosedForArchive(@Param("status") TicketStatus status, @Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.status = :status AND fp.deleted = false AND fp.archived = false")
    long countByStatus(@Param("status") TicketStatus status);

    /** Count tickets that are archived (status=ARCHIVED or legacy archived=true), not deleted. */
    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.deleted = false AND (fp.status = 'ARCHIVED' OR fp.archived = true)")
    long countArchived();

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.classification = :classification AND fp.deleted = false AND fp.archived = false")
    long countByClassification(@Param("classification") Classification classification);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.ragStatus = :ragStatus AND fp.deleted = false AND fp.archived = false")
    long countByRagStatus(@Param("ragStatus") RagStatus ragStatus);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.status NOT IN :statuses AND fp.deleted = false AND fp.archived = false AND fp.ragStatus = :ragStatus")
    long countByStatusNotInAndDeletedFalseAndRagStatus(@Param("statuses") List<TicketStatus> statuses,
                                                       @Param("ragStatus") RagStatus ragStatus);

    @Query("SELECT COUNT(DISTINCT fp.id) FROM FastProblem fp JOIN fp.regions r WHERE r.regionalCode = :region AND fp.deleted = false AND fp.archived = false")
    long countByRegionalCode(@Param("region") RegionalCode region);

    /** Resolved/closed problems (status RESOLVED or CLOSED, not deleted, not archived) for SLA/avg resolution computation. */
    @EntityGraph(attributePaths = {"regions"})
    @Query("SELECT fp FROM FastProblem fp WHERE fp.status IN :statuses AND fp.deleted = false AND fp.archived = false")
    List<FastProblem> findResolvedForMetrics(@Param("statuses") List<TicketStatus> statuses);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.resolvedDate IS NOT NULL AND fp.deleted = false AND fp.archived = false")
    long countResolved();

    @EntityGraph(attributePaths = {"regions"})
    @Query("SELECT fp FROM FastProblem fp WHERE fp.status IN :statuses AND fp.deleted = false AND fp.archived = false")
    List<FastProblem> findByStatusInAndDeletedFalse(@Param("statuses") List<TicketStatus> statuses);

    @Query("""
            SELECT fp FROM FastProblem fp
            WHERE fp.status IN :statuses AND fp.deleted = false AND fp.archived = false
            ORDER BY
              CASE fp.ragStatus
                WHEN com.enterprise.fast.domain.enums.RagStatus.R THEN 0
                WHEN com.enterprise.fast.domain.enums.RagStatus.A THEN 1
                ELSE 2
              END,
              COALESCE(fp.priority, 5) ASC,
              COALESCE(fp.ticketAgeDays, 0) DESC,
              COALESCE(fp.userImpactCount, 0) DESC
            """)
    Page<FastProblem> findTopOpenTickets(@Param("statuses") List<TicketStatus> statuses, Pageable pageable);

    @Query("""
            SELECT DISTINCT fp FROM FastProblem fp
            JOIN fp.regions r
            WHERE fp.status IN :statuses AND fp.deleted = false AND fp.archived = false AND r.regionalCode = :region
            ORDER BY
              CASE fp.ragStatus
                WHEN com.enterprise.fast.domain.enums.RagStatus.R THEN 0
                WHEN com.enterprise.fast.domain.enums.RagStatus.A THEN 1
                ELSE 2
              END,
              COALESCE(fp.priority, 5) ASC,
              COALESCE(fp.ticketAgeDays, 0) DESC,
              COALESCE(fp.userImpactCount, 0) DESC
            """)
    Page<FastProblem> findTopOpenTicketsByRegion(@Param("statuses") List<TicketStatus> statuses,
                                                 @Param("region") RegionalCode region,
                                                 Pageable pageable);

    @Query("""
            SELECT fp FROM FastProblem fp
            WHERE fp.status IN :statuses AND fp.deleted = false AND fp.archived = false
            ORDER BY fp.createdDate DESC
            """)
    Page<FastProblem> findBacklogTickets(@Param("statuses") List<TicketStatus> statuses, Pageable pageable);

    @Query("""
            SELECT DISTINCT fp FROM FastProblem fp
            JOIN fp.regions r
            WHERE fp.status IN :statuses AND fp.deleted = false AND fp.archived = false AND r.regionalCode = :region
            ORDER BY fp.createdDate DESC
            """)
    Page<FastProblem> findBacklogTicketsByRegion(@Param("statuses") List<TicketStatus> statuses,
                                                 @Param("region") RegionalCode region,
                                                 Pageable pageable);

    @Query("""
            SELECT fp FROM FastProblem fp
            LEFT JOIN fp.comments c
            WHERE fp.status = :status AND fp.deleted = false AND fp.archived = false
            GROUP BY fp
            HAVING MAX(c.createdDate) IS NULL OR MAX(c.createdDate) < :cutoff
            """)
    List<FastProblem> findInProgressWithoutRecentComment(@Param("status") TicketStatus status,
                                                         @Param("cutoff") LocalDateTime cutoff);

    /** Only fetch regions to avoid MultipleBagFetchException; links loaded in service for upstream. */
    @EntityGraph(attributePaths = {"regions"})
    @Query("SELECT DISTINCT fp FROM FastProblem fp JOIN fp.links l WHERE l.linkType IN :linkTypes AND fp.deleted = false AND fp.archived = false")
    List<FastProblem> findByLinksLinkTypeInAndDeletedFalse(@Param("linkTypes") List<ExternalLinkType> linkTypes);
}
