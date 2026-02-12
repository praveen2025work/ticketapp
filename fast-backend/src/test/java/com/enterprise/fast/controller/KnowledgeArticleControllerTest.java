package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.KnowledgeArticleResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.service.KnowledgeArticleService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KnowledgeArticleControllerTest {

    @Mock
    private KnowledgeArticleService articleService;

    @InjectMocks
    private KnowledgeArticleController controller;

    private static KnowledgeArticleResponse articleResponse(Long id) {
        return KnowledgeArticleResponse.builder()
                .id(id)
                .fastProblemId(1L)
                .title("Article")
                .rootCause("Cause")
                .workaround("Workaround")
                .status("DRAFT")
                .build();
    }

    @Test
    void getAll_ReturnsPaged() {
        PagedResponse<KnowledgeArticleResponse> paged = PagedResponse.<KnowledgeArticleResponse>builder()
                .content(List.of(articleResponse(1L)))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();
        when(articleService.getAll(0, 20)).thenReturn(paged);
        ResponseEntity<PagedResponse<KnowledgeArticleResponse>> res = controller.getAll(0, 20);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody().getContent()).hasSize(1);
        assertThat(res.getBody().getContent().get(0).getTitle()).isEqualTo("Article");
        verify(articleService).getAll(0, 20);
    }

    @Test
    void getById_ReturnsOk() {
        when(articleService.getById(1L)).thenReturn(articleResponse(1L));
        ResponseEntity<KnowledgeArticleResponse> res = controller.getById(1L);
        assertThat(res.getBody().getId()).isEqualTo(1L);
        assertThat(res.getBody().getTitle()).isEqualTo("Article");
        verify(articleService).getById(1L);
    }

    @Test
    void getByProblemId_ReturnsOk() {
        when(articleService.getByProblemId(1L)).thenReturn(articleResponse(1L));
        ResponseEntity<KnowledgeArticleResponse> res = controller.getByProblemId(1L);
        assertThat(res.getBody().getFastProblemId()).isEqualTo(1L);
        verify(articleService).getByProblemId(1L);
    }

    @Test
    void update_ReturnsOk() {
        when(articleService.update(eq(1L), any(), any(), any(), any(), any())).thenReturn(articleResponse(1L));
        Map<String, String> updates = Map.of("title", "Updated", "rootCause", "c", "workaround", "w", "permanentFix", "f", "category", "cat");
        ResponseEntity<KnowledgeArticleResponse> res = controller.update(1L, updates);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        verify(articleService).update(eq(1L), eq("Updated"), eq("c"), eq("w"), eq("f"), eq("cat"));
    }

    @Test
    void getRoleRules_ReturnsOk() {
        ResponseEntity<Map<String, String>> res = controller.getRoleRules();
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody()).containsKey("content");
    }
}
