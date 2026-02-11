package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.ApprovalRecord;
import com.enterprise.fast.domain.enums.ApprovalDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRecordRepository extends JpaRepository<ApprovalRecord, Long> {

    List<ApprovalRecord> findByFastProblemId(Long fastProblemId);

    List<ApprovalRecord> findByDecision(ApprovalDecision decision);

    List<ApprovalRecord> findByReviewerNameAndDecision(String reviewerName, ApprovalDecision decision);

    long countByFastProblemIdAndDecision(Long fastProblemId, ApprovalDecision decision);
}
