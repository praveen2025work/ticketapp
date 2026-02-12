package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

    List<TicketComment> findByFastProblemIdOrderByCreatedDateDesc(Long fastProblemId);
}
