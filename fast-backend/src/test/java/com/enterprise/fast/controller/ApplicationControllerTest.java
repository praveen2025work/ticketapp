package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.ApplicationRequest;
import com.enterprise.fast.dto.response.ApplicationResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.service.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationControllerTest {

    @Mock
    private ApplicationService applicationService;

    @InjectMocks
    private ApplicationController controller;

    private static ApplicationResponse appResponse(Long id, String name) {
        return ApplicationResponse.builder()
                .id(id)
                .name(name)
                .code("CODE")
                .description("Desc")
                .createdDate(LocalDateTime.now())
                .updatedDate(LocalDateTime.now())
                .build();
    }

    @Test
    void list_ReturnsOkAndList() {
        when(applicationService.findAll()).thenReturn(List.of(appResponse(1L, "App1")));
        ResponseEntity<List<ApplicationResponse>> res = controller.list();
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
        assertThat(res.getBody().get(0).getName()).isEqualTo("App1");
        verify(applicationService).findAll();
    }

    @Test
    void getById_WhenExists_ReturnsOk() {
        when(applicationService.findById(1L)).thenReturn(appResponse(1L, "App1"));
        ResponseEntity<ApplicationResponse> res = controller.getById(1L);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().getName()).isEqualTo("App1");
        verify(applicationService).findById(1L);
    }

    @Test
    void getById_WhenNotExists_Throws() {
        when(applicationService.findById(999L)).thenThrow(new ResourceNotFoundException("Application", "id", 999L));
        try {
            controller.getById(999L);
        } catch (ResourceNotFoundException e) {
            assertThat(e.getMessage()).contains("Application");
        }
        verify(applicationService).findById(999L);
    }

    @Test
    void create_WithValidRequest_Returns201() {
        ApplicationRequest req = new ApplicationRequest("NewApp", "NA", "Description");
        when(applicationService.create(any())).thenReturn(appResponse(1L, "NewApp"));
        ResponseEntity<ApplicationResponse> res = controller.create(req);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody().getName()).isEqualTo("NewApp");
        verify(applicationService).create(any());
    }

    @Test
    void update_WithValidRequest_ReturnsOk() {
        ApplicationRequest req = new ApplicationRequest("Updated", "U", "Desc");
        when(applicationService.update(eq(1L), any())).thenReturn(appResponse(1L, "Updated"));
        ResponseEntity<ApplicationResponse> res = controller.update(1L, req);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().getName()).isEqualTo("Updated");
        verify(applicationService).update(eq(1L), any());
    }

    @Test
    void delete_WhenExists_Returns204() {
        doNothing().when(applicationService).deleteById(1L);
        ResponseEntity<Void> res = controller.delete(1L);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(applicationService).deleteById(1L);
    }
}
