package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.AppSettingsResponse;
import com.enterprise.fast.service.AppSettingsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppSettingsControllerTest {

    @Mock
    private AppSettingsService settingsService;

    @InjectMocks
    private AppSettingsController controller;

    @Test
    void getSettings_ReturnsOk() {
        when(settingsService.getSettings(true)).thenReturn(
                AppSettingsResponse.builder().settings(Map.of("key", "value")).build());
        ResponseEntity<AppSettingsResponse> res = controller.getSettings();
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody().getSettings()).containsEntry("key", "value");
        verify(settingsService).getSettings(true);
    }

    @Test
    void updateSettings_Returns204() {
        ResponseEntity<Void> res = controller.updateSettings(Map.of("smtpHost", "smtp.example.com"));
        assertThat(res.getStatusCodeValue()).isEqualTo(204);
        verify(settingsService).updateSettings(anyMap());
    }
}
