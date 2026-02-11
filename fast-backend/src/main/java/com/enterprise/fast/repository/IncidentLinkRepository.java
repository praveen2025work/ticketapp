package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.IncidentLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentLinkRepository extends JpaRepository<IncidentLink, Long> {

    List<IncidentLink> findByFastProblemId(Long fastProblemId);

    List<IncidentLink> findByIncidentNumber(String incidentNumber);
}
