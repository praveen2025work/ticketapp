package com.enterprise.fast.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fast_problem_property", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"fast_problem_id", "property_key"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FastProblemProperty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fast_problem_id", nullable = false)
    private FastProblem fastProblem;

    @Column(name = "property_key", nullable = false, length = 255)
    private String propertyKey;

    @Lob
    @Column(name = "property_value")
    private String propertyValue;
}
