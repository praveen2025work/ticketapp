package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.AppSettingsResponse;
import com.enterprise.fast.service.AppSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@Tag(name = "Settings", description = "Application settings (admin)")
public class AppSettingsController {

    private final AppSettingsService settingsService;

    @GetMapping
    @Operation(summary = "Get all settings (sensitive values masked for non-admin)")
    public ResponseEntity<AppSettingsResponse> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings(true));
    }

    @PutMapping
    @Operation(summary = "Update settings (Admin only)")
    public ResponseEntity<Void> updateSettings(@RequestBody Map<String, String> updates) {
        settingsService.updateSettings(updates);
        return ResponseEntity.noContent().build();
    }
}
