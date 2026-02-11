package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.KnowledgeArticle;
import com.enterprise.fast.domain.enums.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KnowledgeArticleRepository extends JpaRepository<KnowledgeArticle, Long> {

    Optional<KnowledgeArticle> findByFastProblemId(Long fastProblemId);

    Page<KnowledgeArticle> findByStatus(ArticleStatus status, Pageable pageable);

    long countByStatus(ArticleStatus status);
}
