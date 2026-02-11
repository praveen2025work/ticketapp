package com.enterprise.fast.service;

import com.enterprise.fast.dto.response.KnowledgeArticleResponse;
import com.enterprise.fast.dto.response.PagedResponse;

public interface KnowledgeArticleService {

    KnowledgeArticleResponse getById(Long id);

    KnowledgeArticleResponse getByProblemId(Long problemId);

    PagedResponse<KnowledgeArticleResponse> getAll(int page, int size);

    KnowledgeArticleResponse update(Long id, String title, String rootCause, String workaround,
                                     String permanentFix, String category);

    void createFromResolvedProblem(Long problemId);
}
