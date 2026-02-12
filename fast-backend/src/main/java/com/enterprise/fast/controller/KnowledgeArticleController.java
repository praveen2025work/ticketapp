package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.KnowledgeArticleResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.service.KnowledgeArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/knowledge")
@RequiredArgsConstructor
@Tag(name = "Knowledge Articles", description = "Knowledge base management endpoints")
public class KnowledgeArticleController {

    private final KnowledgeArticleService articleService;

    @GetMapping
    @Operation(summary = "List all knowledge articles (paginated)")
    public ResponseEntity<PagedResponse<KnowledgeArticleResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(articleService.getAll(page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get knowledge article by ID")
    public ResponseEntity<KnowledgeArticleResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(articleService.getById(id));
    }

    @GetMapping("/problem/{problemId}")
    @Operation(summary = "Get knowledge article for a specific problem")
    public ResponseEntity<KnowledgeArticleResponse> getByProblemId(@PathVariable Long problemId) {
        return ResponseEntity.ok(articleService.getByProblemId(problemId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a knowledge article")
    public ResponseEntity<KnowledgeArticleResponse> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(articleService.update(id,
                updates.get("title"),
                updates.get("rootCause"),
                updates.get("workaround"),
                updates.get("permanentFix"),
                updates.get("category")));
    }

    @GetMapping("/role-rules")
    @Operation(summary = "Get role rules (who can do what)")
    public ResponseEntity<Map<String, String>> getRoleRules() {
        try {
            String content = StreamUtils.copyToString(
                    new ClassPathResource("role-rules.md").getInputStream(),
                    StandardCharsets.UTF_8);
            return ResponseEntity.ok(Map.of("content", content));
        } catch (IOException e) {
            return ResponseEntity.ok(Map.of("content", "# Role rules\n\nUnable to load role rules."));
        }
    }
}
