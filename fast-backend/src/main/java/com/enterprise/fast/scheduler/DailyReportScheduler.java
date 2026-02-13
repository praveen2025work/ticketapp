package com.enterprise.fast.scheduler;

import com.enterprise.fast.domain.enums.RegionalCode;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.service.AppSettingsService;
import com.enterprise.fast.service.DailyReportTemplateService;
import com.enterprise.fast.service.EmailService;
import com.enterprise.fast.service.FastProblemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyReportScheduler {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final AppSettingsService appSettingsService;
    private final FastProblemService problemService;
    private final EmailService emailService;
    private final DailyReportTemplateService dailyReportTemplateService;

    /**
     * Run every hour at minute 0. For each zone (APAC, EMEA, AMER), if enabled and current time matches zone's send time, send report.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void sendDailyReports() {
        Map<String, String> s = appSettingsService.getSettings(false).getSettings();
        if (!"true".equalsIgnoreCase(s.get("dailyReportEnabled"))) {
            return;
        }
        String now = LocalTime.now().format(TIME_FMT);
        for (RegionalCode zone : RegionalCode.values()) {
            String keyEnabled = "dailyReport" + zone.name().charAt(0) + zone.name().substring(1).toLowerCase();
            String keyTime = keyEnabled + "Time";
            String keyRecipients = keyEnabled + "Recipients";
            if (!"true".equalsIgnoreCase(s.get(keyEnabled))) continue;
            String configuredTime = s.get(keyTime);
            if (configuredTime == null || configuredTime.isBlank()) configuredTime = "08:00";
            if (!now.equals(configuredTime.trim())) continue;
            String recipients = s.get(keyRecipients);
            if (recipients == null || recipients.isBlank()) {
                log.warn("Daily report for {} enabled but no recipients configured", zone);
                continue;
            }
            try {
                sendReportForZone(zone, recipients.trim().split("\\s*,\\s*"));
            } catch (Exception e) {
                log.error("Failed to send daily report for {}: {}", zone, e.getMessage());
            }
        }
    }

    private void sendReportForZone(RegionalCode zone, String[] toEmails) {
        List<FastProblemResponse> openTickets = problemService.exportWithFilters(
                null, zone.name(), null, null, null, null, "OPEN", 500);
        String subject = "FAST Daily Report – " + zone.name() + " – " + java.time.LocalDate.now();
        String body = dailyReportTemplateService.buildHtml(zone.name(), java.time.LocalDate.now().toString(), openTickets);
        for (String to : toEmails) {
            if (to != null && !to.isBlank()) {
                emailService.sendEmail(to.trim(), subject, body);
            }
        }
        log.info("Sent daily report for {} to {} recipients ({} tickets)", zone, toEmails.length, openTickets.size());
    }
}
