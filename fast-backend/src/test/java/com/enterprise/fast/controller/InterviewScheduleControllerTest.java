package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.InterviewScheduleRequest;
import com.enterprise.fast.dto.request.InterviewScheduleEntryRequest;
import com.enterprise.fast.dto.response.InterviewScheduleResponse;
import com.enterprise.fast.service.InterviewScheduleService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterviewScheduleControllerTest {

    @Mock
    private InterviewScheduleService service;

    @InjectMocks
    private InterviewScheduleController controller;

    private InterviewScheduleResponse response(Long id) {
        return InterviewScheduleResponse.builder()
                .id(id)
                .businessArea("Rates")
                .interviewDate(LocalDate.of(2026, 3, 1))
                .createdBy("admin")
                .updatedBy("admin")
                .createdDate(LocalDateTime.now())
                .updatedDate(LocalDateTime.now())
                .entries(List.of())
                .build();
    }

    @Test
    void list_ReturnsOk() {
        when(service.findAll()).thenReturn(List.of(response(1L)));

        ResponseEntity<List<InterviewScheduleResponse>> res = controller.list();

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
        verify(service).findAll();
    }

    @Test
    void create_ReturnsCreated() {
        Authentication auth = new UsernamePasswordAuthenticationToken("admin", "n/a");
        when(service.create(any(InterviewScheduleRequest.class), eq("admin"))).thenReturn(response(2L));

        InterviewScheduleRequest request = InterviewScheduleRequest.builder()
                .interviewDate(LocalDate.of(2026, 3, 2))
                .entries(List.of(InterviewScheduleEntryRequest.builder().timeSlot("08:00").businessFunction("Checks").build()))
                .build();

        ResponseEntity<InterviewScheduleResponse> res = controller.create(request, auth);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody().getId()).isEqualTo(2L);
        verify(service).create(any(InterviewScheduleRequest.class), eq("admin"));
    }

    @Test
    void update_ReturnsOk() {
        Authentication auth = new UsernamePasswordAuthenticationToken("admin", "n/a");
        when(service.update(eq(4L), any(InterviewScheduleRequest.class), eq("admin"))).thenReturn(response(4L));

        InterviewScheduleRequest request = InterviewScheduleRequest.builder()
                .interviewDate(LocalDate.of(2026, 3, 2))
                .entries(List.of(InterviewScheduleEntryRequest.builder().timeSlot("08:00").businessFunction("Checks").build()))
                .build();

        ResponseEntity<InterviewScheduleResponse> res = controller.update(4L, request, auth);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().getId()).isEqualTo(4L);
        verify(service).update(eq(4L), any(InterviewScheduleRequest.class), eq("admin"));
    }
}
