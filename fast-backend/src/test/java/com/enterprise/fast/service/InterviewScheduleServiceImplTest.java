package com.enterprise.fast.service;

import com.enterprise.fast.domain.entity.InterviewSchedule;
import com.enterprise.fast.domain.entity.InterviewScheduleEntry;
import com.enterprise.fast.dto.request.InterviewScheduleEntryRequest;
import com.enterprise.fast.dto.request.InterviewScheduleRequest;
import com.enterprise.fast.dto.response.InterviewScheduleResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.InterviewScheduleRepository;
import com.enterprise.fast.service.impl.InterviewScheduleServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterviewScheduleServiceImplTest {

    @Mock
    private InterviewScheduleRepository repository;

    @InjectMocks
    private InterviewScheduleServiceImpl service;

    @Test
    void create_WithValidEntries_PersistsAndReturnsFullTimeline() {
        when(repository.save(any(InterviewSchedule.class))).thenAnswer(invocation -> {
            InterviewSchedule toSave = invocation.getArgument(0);
            toSave.setId(10L);
            long nextId = 100L;
            for (InterviewScheduleEntry entry : toSave.getEntries()) {
                entry.setId(nextId++);
            }
            return toSave;
        });

        InterviewScheduleRequest request = InterviewScheduleRequest.builder()
                .businessArea("Rates")
                .pcDirector("Director A")
                .productController("Controller A")
                .namedPnls("PnL 1")
                .location("London")
                .interviewedBy("Thenmozi")
                .interviewDate(LocalDate.of(2026, 3, 1))
                .entries(List.of(
                        InterviewScheduleEntryRequest.builder()
                                .timeSlot("08:00")
                                .businessFunction("Morning checks")
                                .applicationsUsed("MOTIF; RecFactory")
                                .processImprovements("Automate checklist reminders")
                                .techIssuesToResolve("Manual feed retry")
                                .ticketRaised("INC-FAST-3001")
                                .build(),
                        InterviewScheduleEntryRequest.builder().timeSlot("09:00").businessFunction("Rate validation").build(),
                        InterviewScheduleEntryRequest.builder().timeSlot("10:00").businessFunction("Rate validation").build(),
                        InterviewScheduleEntryRequest.builder().timeSlot("11:00").businessFunction("").build()
                ))
                .build();

        InterviewScheduleResponse response = service.create(request, "admin");

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getCreatedBy()).isEqualTo("admin");
        assertThat(response.getEntries()).hasSize(14);
        assertThat(response.getEntries().stream().filter(e -> "08:00".equals(e.getTimeSlot())).findFirst().orElseThrow().getBusinessFunction())
                .isEqualTo("Morning checks");
        assertThat(response.getEntries().stream().filter(e -> "09:00".equals(e.getTimeSlot())).findFirst().orElseThrow().getBusinessFunction())
                .isEqualTo("Rate validation");
        assertThat(response.getEntries().stream().filter(e -> "11:00".equals(e.getTimeSlot())).findFirst().orElseThrow().getBusinessFunction())
                .isNull();
        assertThat(response.getEntries().stream().filter(e -> "08:00".equals(e.getTimeSlot())).findFirst().orElseThrow().getApplicationsUsed())
                .isEqualTo("MOTIF; RecFactory");
        assertThat(response.getEntries().stream().filter(e -> "08:00".equals(e.getTimeSlot())).findFirst().orElseThrow().getTicketRaised())
                .isEqualTo("INC-FAST-3001");
    }

    @Test
    void create_WithInvalidTimeSlot_ThrowsBadRequest() {
        InterviewScheduleRequest request = InterviewScheduleRequest.builder()
                .interviewDate(LocalDate.of(2026, 3, 1))
                .entries(List.of(
                        InterviewScheduleEntryRequest.builder().timeSlot("07:00").businessFunction("Invalid").build()
                ))
                .build();

        assertThatThrownBy(() -> service.create(request, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid time slot");

        verify(repository, never()).save(any());
    }

    @Test
    void update_WhenRecordMissing_ThrowsNotFound() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        InterviewScheduleRequest request = InterviewScheduleRequest.builder()
                .interviewDate(LocalDate.of(2026, 3, 1))
                .entries(List.of(
                        InterviewScheduleEntryRequest.builder().timeSlot("08:00").businessFunction("Task").build()
                ))
                .build();

        assertThatThrownBy(() -> service.update(404L, request, "admin"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
