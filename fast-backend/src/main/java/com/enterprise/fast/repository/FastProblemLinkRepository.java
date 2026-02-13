package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.FastProblemLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FastProblemLinkRepository extends JpaRepository<FastProblemLink, Long> {

    List<FastProblemLink> findByFastProblemIdOrderById(Long fastProblemId);

    List<FastProblemLink> findByFastProblem_IdInOrderByFastProblemIdAscIdAsc(List<Long> fastProblemIds);
}
