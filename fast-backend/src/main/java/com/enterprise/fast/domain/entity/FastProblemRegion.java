package com.enterprise.fast.domain.entity;

import com.enterprise.fast.domain.enums.RegionalCode;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fast_problem_region", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"fast_problem_id", "regional_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FastProblemRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fast_problem_id", nullable = false)
    private FastProblem fastProblem;

    @Enumerated(EnumType.STRING)
    @Column(name = "regional_code", nullable = false, length = 10)
    private RegionalCode regionalCode;
}
