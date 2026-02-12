package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.FastProblemProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FastProblemPropertyRepository extends JpaRepository<FastProblemProperty, Long> {

    List<FastProblemProperty> findByFastProblemIdOrderByPropertyKey(Long fastProblemId);

    Optional<FastProblemProperty> findByFastProblemIdAndPropertyKey(Long fastProblemId, String propertyKey);

    void deleteByFastProblemIdAndPropertyKey(Long fastProblemId, String propertyKey);
}
