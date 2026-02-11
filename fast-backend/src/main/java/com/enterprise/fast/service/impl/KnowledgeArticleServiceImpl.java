package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.entity.KnowledgeArticle;
import com.enterprise.fast.domain.enums.ArticleStatus;
import com.enterprise.fast.dto.response.KnowledgeArticleResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.mapper.FastProblemMapper;
import com.enterprise.fast.repository.FastProblemRepository;
import com.enterprise.fast.repository.KnowledgeArticleRepository;
import com.enterprise.fast.service.KnowledgeArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class KnowledgeArticleServiceImpl implements KnowledgeArticleService {

    private final KnowledgeArticleRepository articleRepository;
    private final FastProblemRepository problemRepository;
    private final FastProblemMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public KnowledgeArticleResponse getById(Long id) {
        KnowledgeArticle article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KnowledgeArticle", "id", id));
        return mapper.toKnowledgeArticleResponse(article);
    }

    @Override
    @Transactional(readOnly = true)
    public KnowledgeArticleResponse getByProblemId(Long problemId) {
        KnowledgeArticle article = articleRepository.findByFastProblemId(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("KnowledgeArticle", "problemId", problemId));
        return mapper.toKnowledgeArticleResponse(article);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<KnowledgeArticleResponse> getAll(int page, int size) {
        Page<KnowledgeArticle> articlePage = articleRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdDate").descending()));

        return PagedResponse.<KnowledgeArticleResponse>builder()
                .content(articlePage.getContent().stream().map(mapper::toKnowledgeArticleResponse).toList())
                .page(articlePage.getNumber())
                .size(articlePage.getSize())
                .totalElements(articlePage.getTotalElements())
                .totalPages(articlePage.getTotalPages())
                .last(articlePage.isLast())
                .build();
    }

    @Override
    @Transactional
    public KnowledgeArticleResponse update(Long id, String title, String rootCause,
                                            String workaround, String permanentFix, String category) {
        KnowledgeArticle article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KnowledgeArticle", "id", id));

        if (title != null) article.setTitle(title);
        if (rootCause != null) article.setRootCause(rootCause);
        if (workaround != null) article.setWorkaround(workaround);
        if (permanentFix != null) article.setPermanentFix(permanentFix);
        if (category != null) article.setCategory(category);

        KnowledgeArticle saved = articleRepository.save(article);
        return mapper.toKnowledgeArticleResponse(saved);
    }

    @Override
    @Transactional
    public void createFromResolvedProblem(Long problemId) {
        // Check if article already exists
        if (articleRepository.findByFastProblemId(problemId).isPresent()) {
            return;
        }

        FastProblem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("FastProblem", "id", problemId));

        KnowledgeArticle article = KnowledgeArticle.builder()
                .fastProblem(problem)
                .title("KB: " + problem.getTitle())
                .rootCause(problem.getRootCause())
                .workaround(problem.getWorkaround())
                .permanentFix(problem.getPermanentFix())
                .category(problem.getAffectedApplication())
                .build();

        articleRepository.save(article);
    }
}
