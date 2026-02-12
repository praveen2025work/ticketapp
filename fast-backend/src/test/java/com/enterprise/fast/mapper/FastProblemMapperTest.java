package com.enterprise.fast.mapper;

import com.enterprise.fast.domain.entity.*;
import com.enterprise.fast.domain.enums.*;
import com.enterprise.fast.dto.request.CreateFastProblemRequest;
import com.enterprise.fast.dto.response.FastProblemResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FastProblemMapperTest {

    private FastProblemMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new FastProblemMapper();
    }

    @Test
    void toEntity_WithRequest_MapsCorrectly() {
        CreateFastProblemRequest request = CreateFastProblemRequest.builder()
                .title("Test Title")
                .description("Desc")
                .regionalCodes(List.of("AMER", "EMEA"))
                .userImpactCount(10)
                .priority(2)
                .targetResolutionHours(8)
                .build();
        FastProblem entity = mapper.toEntity(request, "user1");
        assertThat(entity).isNotNull();
        assertThat(entity.getTitle()).isEqualTo("Test Title");
        assertThat(entity.getDescription()).isEqualTo("Desc");
        assertThat(entity.getCreatedBy()).isEqualTo("user1");
        assertThat(entity.getRegions()).hasSize(2);
        assertThat(entity.getUserImpactCount()).isEqualTo(10);
        assertThat(entity.getPriority()).isEqualTo(2);
        assertThat(entity.getTargetResolutionHours()).isEqualTo(8);
    }

    @Test
    void toEntity_WithNullOptionalFields_UsesDefaults() {
        CreateFastProblemRequest request = CreateFastProblemRequest.builder()
                .title("T")
                .regionalCodes(List.of("AMER"))
                .build();
        FastProblem entity = mapper.toEntity(request, "u");
        assertThat(entity.getUserImpactCount()).isEqualTo(0);
        assertThat(entity.getTargetResolutionHours()).isEqualTo(4);
        assertThat(entity.getPriority()).isEqualTo(3);
    }

    @Test
    void toResponse_WithMinimalEntity_ReturnsResponse() {
        FastProblem problem = FastProblem.builder()
                .id(1L)
                .title("P")
                .classification(Classification.A)
                .status(TicketStatus.NEW)
                .regions(new java.util.ArrayList<>())
                .build();
        FastProblemResponse response = mapper.toResponse(problem);
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("P");
        assertThat(response.getClassification()).isEqualTo("A");
        assertThat(response.getStatus()).isEqualTo("NEW");
    }

    @Test
    void toSummaryResponse_WithEntity_ReturnsSummary() {
        FastProblem problem = FastProblem.builder()
                .id(1L)
                .title("Summary")
                .classification(Classification.R)
                .status(TicketStatus.ASSIGNED)
                .createdBy("u")
                .createdDate(LocalDateTime.now())
                .regions(new java.util.ArrayList<>())
                .build();
        FastProblemResponse response = mapper.toSummaryResponse(problem);
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Summary");
        assertThat(response.getClassification()).isEqualTo("R");
        assertThat(response.getStatus()).isEqualTo("ASSIGNED");
    }
}
