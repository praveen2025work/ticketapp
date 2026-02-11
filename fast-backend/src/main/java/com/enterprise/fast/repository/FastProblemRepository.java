package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FastProblemRepository extends JpaRepository<FastProblem, Long>, JpaSpecificationExecutor<FastProblem> {

    Page<FastProblem> findByDeletedFalse(Pageable pageable);

    Page<FastProblem> findByRegionalCodeAndDeletedFalse(RegionalCode regionalCode, Pageable pageable);

    Page<FastProblem> findByClassificationAndDeletedFalse(Classification classification, Pageable pageable);

    Page<FastProblem> findByStatusAndDeletedFalse(TicketStatus status, Pageable pageable);

    List<FastProblem> findByStatusNotInAndDeletedFalse(List<TicketStatus> statuses);

    @Query("SELECT fp FROM FastProblem fp WHERE fp.deleted = false AND " +
           "(LOWER(fp.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(fp.pbtId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(fp.servicenowIncidentNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(fp.servicenowProblemNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<FastProblem> searchByKeyword(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.status = :status AND fp.deleted = false")
    long countByStatus(@Param("status") TicketStatus status);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.classification = :classification AND fp.deleted = false")
    long countByClassification(@Param("classification") Classification classification);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.regionalCode = :region AND fp.deleted = false")
    long countByRegionalCode(@Param("region") RegionalCode region);

    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, fp.createdDate, fp.resolvedDate)) FROM FastProblem fp " +
           "WHERE fp.resolvedDate IS NOT NULL AND fp.deleted = false")
    Double findAverageResolutionTimeHours();

    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, fp.createdDate, fp.resolvedDate)) FROM FastProblem fp " +
           "WHERE fp.resolvedDate IS NOT NULL AND fp.regionalCode = :region AND fp.deleted = false")
    Double findAverageResolutionTimeByRegion(@Param("region") RegionalCode region);

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.resolvedDate IS NOT NULL " +
           "AND TIMESTAMPDIFF(HOUR, fp.createdDate, fp.resolvedDate) <= fp.targetResolutionHours " +
           "AND fp.deleted = false")
    long countWithinSla();

    @Query("SELECT COUNT(fp) FROM FastProblem fp WHERE fp.resolvedDate IS NOT NULL AND fp.deleted = false")
    long countResolved();
}
