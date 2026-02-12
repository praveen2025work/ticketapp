package com.enterprise.fast.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_comment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fast_problem_id", nullable = false)
    private FastProblem fastProblem;

    @Column(name = "author_username", nullable = false, length = 50)
    private String authorUsername;

    @Lob
    @Column(name = "comment_text", nullable = false)
    private String commentText;

    @Column(name = "created_date")
    @Builder.Default
    private LocalDateTime createdDate = LocalDateTime.now();
}
