package com.enterprise.fast.domain.entity;

import com.enterprise.fast.domain.enums.LinkType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "incident_link")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fast_problem_id", nullable = false)
    private FastProblem fastProblem;

    @Column(name = "incident_number", nullable = false, length = 20)
    private String incidentNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", length = 20)
    @Builder.Default
    private LinkType linkType = LinkType.RELATED_TO;

    @Column(length = 500)
    private String description;

    @Column(name = "linked_date")
    @Builder.Default
    private LocalDateTime linkedDate = LocalDateTime.now();
}
