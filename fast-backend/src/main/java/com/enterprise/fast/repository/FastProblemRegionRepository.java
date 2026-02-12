package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.FastProblemRegion;
import com.enterprise.fast.domain.enums.RegionalCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FastProblemRegionRepository extends JpaRepository<FastProblemRegion, Long> {

    long countByRegionalCode(RegionalCode regionalCode);

    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, fp.createdDate, fp.resolvedDate)) FROM FastProblem fp " +
           "JOIN fp.regions r WHERE r.regionalCode = :region AND fp.resolvedDate IS NOT NULL AND fp.deleted = false")
    Double findAverageResolutionTimeByRegion(@Param("region") RegionalCode region);
}
