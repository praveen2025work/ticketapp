package com.enterprise.fast.service;

import com.enterprise.fast.domain.entity.Application;
import com.enterprise.fast.dto.request.ApplicationRequest;
import com.enterprise.fast.dto.response.ApplicationResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.ApplicationRepository;
import com.enterprise.fast.service.impl.ApplicationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceImplTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private ApplicationServiceImpl service;

    private Application app;
    private ApplicationRequest request;

    @BeforeEach
    void setUp() {
        app = Application.builder()
                .id(1L)
                .name("TestApp")
                .code("TA")
                .description("Desc")
                .createdDate(LocalDateTime.now())
                .updatedDate(LocalDateTime.now())
                .build();
        request = ApplicationRequest.builder()
                .name("TestApp")
                .code("TA")
                .description("Desc")
                .build();
    }

    @Test
    void findAll_ReturnsList() {
        when(applicationRepository.findAllByOrderByNameAsc()).thenReturn(List.of(app));
        List<ApplicationResponse> result = service.findAll();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("TestApp");
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void findById_WhenExists_ReturnsResponse() {
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        ApplicationResponse result = service.findById(1L);
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("TestApp");
    }

    @Test
    void findById_WhenNotExists_ThrowsResourceNotFoundException() {
        when(applicationRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Application");
    }

    @Test
    void create_WithNewName_SavesAndReturns() {
        when(applicationRepository.findByName("NewApp")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setId(1L);
            a.setCreatedDate(LocalDateTime.now());
            return a;
        });
        ApplicationRequest req = ApplicationRequest.builder().name("NewApp").code("N").description("D").build();
        ApplicationResponse result = service.create(req);
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("NewApp");
        verify(applicationRepository).save(any());
    }

    @Test
    void create_WhenNameExists_ThrowsIllegalArgumentException() {
        when(applicationRepository.findByName("Existing")).thenReturn(Optional.of(app));
        ApplicationRequest req = ApplicationRequest.builder().name("Existing").build();
        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void update_WhenExists_UpdatesAndReturns() {
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenReturn(app);
        ApplicationResponse result = service.update(1L, ApplicationRequest.builder().name("Updated").build());
        assertThat(result).isNotNull();
        assertThat(app.getName()).isEqualTo("Updated");
        verify(applicationRepository).save(app);
    }

    @Test
    void update_WhenNotExists_ThrowsResourceNotFoundException() {
        when(applicationRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(999L, request))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void deleteById_WhenExists_Deletes() {
        when(applicationRepository.existsById(1L)).thenReturn(true);
        doNothing().when(applicationRepository).deleteById(1L);
        service.deleteById(1L);
        verify(applicationRepository).deleteById(1L);
    }

    @Test
    void deleteById_WhenNotExists_ThrowsResourceNotFoundException() {
        when(applicationRepository.existsById(999L)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(applicationRepository, never()).deleteById(any());
    }
}
