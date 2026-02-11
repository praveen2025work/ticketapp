package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeArticleResponse {

    private Long id;
    private Long fastProblemId;
    private String title;
    private String rootCause;
    private String workaround;
    private String permanentFix;
    private String category;
    private String status;
    private LocalDateTime createdDate;
    private LocalDateTime publishedDate;
}
