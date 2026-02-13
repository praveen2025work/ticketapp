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
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FastProblemRepository extends JpaRepository<FastProblem, Long>, JpaSpecificationExecutor<FastProblem> {

    Page<FastProblem> findByDeletedFalse(Pageable pageable);

    @EntityGraph(attributePaths = {"comments", "regions"})
    @Query("SELECT fp FROM FastProblem fp WHERE fp.status = :status AND fp.deleted = false")
    List<FastProblem> findByStatusAndDeletedFalseWithComments(@Param("status") TicketStatus status);

    List<FastProblem> findByStatusAndDeletedFalse(TicketStatus status);

    Page<FastProblem> findByRegions_RegionalCodeAndDeletedFalse(RegionalCode regionalCode, Pageable pageable);

    Page<FastProblem> findByClassificationAndDeletedFalse(Classification classification, Pageable pageable);

    Page<FastProblem> findByStatusAndDeletedFalse(TicketStatus status, Pageable pageable);

    List<FastProblem> findByStatusNotInAndDeletedFalse(List<TicketStatus> statuses);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.status = :status AND fp.deleted = false")
    long countByStatus(@Param("status") TicketStatus status);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.classification = :classification AND fp.deleted = false")
    long countByClassification(@Param("classification") Classification classification);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.ragStatus = :ragStatus AND fp.deleted = false")
    long countByRagStatus(@Param("ragStatus") RagStatus ragStatus);

    @Query("SELECT COUNT(DISTINCT fp.id) FROM FastProblem fp JOIN fp.regions r WHERE r.regionalCode = :region AND fp.deleted = false")
    long countByRegionalCode(@Param("region") RegionalCode region);

    /** Resolved/closed problems (status RESOLVED or CLOSED, not deleted) for SLA/avg resolution computation. Aligns with dashboard "resolved" count. */
    @EntityGraph(attributePaths = {"regions"})
    @Query("SELECT fp FROM FastProblem fp WHERE fp.status IN :statuses AND fp.deleted = false")
    List<FastProblem> findResolvedForMetrics(@Param("statuses") List<TicketStatus> statuses);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.resolvedDate IS NOT NULL AND fp.deleted = false")
    long countResolved();

    @EntityGraph(attributePaths = {"regions"})
    @Query("SELECT fp FROM FastProblem fp WHERE fp.status IN :statuses AND fp.deleted = false")
    List<FastProblem> findByStatusInAndDeletedFalse(@Param("statuses") List<TicketStatus> statuses);

    /** Only fetch regions to avoid MultipleBagFetchException; links loaded in service for upstream. */
    @EntityGraph(attributePaths = {"regions"})
    @Query("SELECT DISTINCT fp FROM FastProblem fp JOIN fp.links l WHERE l.linkType IN :linkTypes AND fp.deleted = false")
    List<FastProblem> findByLinksLinkTypeInAndDeletedFalse(@Param("linkTypes") List<ExternalLinkType> linkTypes);
}
