package com.enterprise.fast.domain.entity;

import com.enterprise.fast.domain.enums.ExternalLinkType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fast_problem_link")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FastProblemLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fast_problem_id", nullable = false)
    private FastProblem fastProblem;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 2000)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", length = 20)
    @Builder.Default
    private ExternalLinkType linkType = ExternalLinkType.OTHER;
}
