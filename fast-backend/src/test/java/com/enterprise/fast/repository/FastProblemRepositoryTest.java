package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.entity.FastProblemRegion;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.domain.enums.TicketStatus;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class FastProblemRepositoryTest {

    @Autowired
    private FastProblemRepository repository;

    @Test
    void findByDeletedFalse_ReturnsOnlyNonDeleted() {
        FastProblem p = FastProblem.builder()
                .title("Test")
                .classification(Classification.A)
                .status(TicketStatus.BACKLOG)
                .deleted(false)
                .createdBy("test")
                .build();
        p.getRegions().add(FastProblemRegion.builder().fastProblem(p).regionalCode(RegionalCode.AMER).build());
        repository.save(p);

        var result = repository.findByDeletedFalse(PageRequest.of(0, 10));
        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent().get(0).getDeleted()).isFalse();
    }

    @Test
    @Disabled("H2 dialect differs from Oracle for lower() in specification")
    void findAll_WithSpecification_AppliesFilters() {
        FastProblem p = FastProblem.builder()
                .title("UniqueSearchTerm123")
                .classification(Classification.A)
                .status(TicketStatus.BACKLOG)
                .deleted(false)
                .createdBy("test")
                .build();
        p.getRegions().add(FastProblemRegion.builder().fastProblem(p).regionalCode(RegionalCode.AMER).build());
        repository.save(p);

        var spec = FastProblemSpecification.withFilters("UniqueSearchTerm123", null, null, null, null, null, null);
        var result = repository.findAll(spec, PageRequest.of(0, 10));
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).contains("UniqueSearchTerm123");
    }
}
