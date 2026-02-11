package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByFastProblemIdOrderByTimestampDesc(Long fastProblemId);

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
}
