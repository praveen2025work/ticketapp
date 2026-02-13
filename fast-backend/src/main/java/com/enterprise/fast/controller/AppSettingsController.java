package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.AppSettingsResponse;
import com.enterprise.fast.service.AppSettingsService;
import com.enterprise.fast.service.DailyReportTemplateService;
import com.enterprise.fast.service.FastProblemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Settings", description = "Application settings (admin)")
public class AppSettingsController {

    private final AppSettingsService settingsService;
    private final FastProblemService problemService;
    private final DailyReportTemplateService dailyReportTemplateService;

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

    @GetMapping("/daily-report-preview")
    @Operation(summary = "Get Daily Report HTML preview for a zone (APAC, EMEA, AMER)")
    public ResponseEntity<Map<String, String>> getDailyReportPreview(@RequestParam(defaultValue = "APAC") String zone) {
        try {
            String zoneName = zone != null && !zone.isBlank() ? zone.trim().toUpperCase() : "APAC";
            if (!List.of("APAC", "EMEA", "AMER").contains(zoneName)) {
                zoneName = "APAC";
            }
            var openTickets = problemService.exportWithFilters(
                    null, zoneName, null, null, null, null, "OPEN", null, null, null, null, null, 500);
            String html = dailyReportTemplateService.buildHtml(zoneName, LocalDate.now().toString(), openTickets);
            return ResponseEntity.ok(Map.of("html", html != null ? html : ""));
        } catch (Throwable e) {
            log.error("Daily report preview failed for zone {}", zone, e);
            String errorMsg;
            try {
                String msg = e.getMessage();
                if (msg == null || msg.isEmpty()) msg = e.getClass().getSimpleName();
                else if (msg.length() > 500) msg = msg.substring(0, 500) + "...";
                errorMsg = msg.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
            } catch (Throwable ignored) {
                errorMsg = "Error";
            }
            String errorHtml = "<!DOCTYPE html><html><body style=\"font-family:sans-serif;padding:2rem;\"><h2>Preview error</h2><p>" + errorMsg + "</p></body></html>";
            return ResponseEntity.ok(Map.of("html", errorHtml));
        }
    }
}
