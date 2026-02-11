package com.enterprise.fast.domain.entity;

import com.enterprise.fast.domain.enums.ArticleStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "knowledge_article")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fast_problem_id", unique = true)
    private FastProblem fastProblem;

    @Column(nullable = false)
    private String title;

    @Lob
    @Column(name = "root_cause")
    private String rootCause;

    @Lob
    private String workaround;

    @Lob
    @Column(name = "permanent_fix")
    private String permanentFix;

    @Column(length = 50)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private ArticleStatus status = ArticleStatus.DRAFT;

    @Column(name = "created_date")
    @Builder.Default
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "published_date")
    private LocalDateTime publishedDate;
}
