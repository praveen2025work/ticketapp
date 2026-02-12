package com.enterprise.fast.service.impl;

import com.enterprise.fast.service.AppSettingsService;
import com.enterprise.fast.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final AppSettingsService settingsService;

    @Override
    public boolean sendEmail(String toEmail, String subject, String body) {
        Map<String, String> settings = settingsService.getSettings(false).getSettings();
        String host = settings.get("smtpHost");
        String portStr = settings.get("smtpPort");
        String username = settings.get("smtpUsername");
        String password = settings.get("smtpPassword");
        String from = settings.get("smtpFrom");

        if (host == null || host.isBlank() || toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send email: missing smtpHost or toEmail");
            return false;
        }

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        try {
            if (portStr != null && !portStr.isBlank()) {
                mailSender.setPort(Integer.parseInt(portStr.trim()));
            } else {
                mailSender.setPort(587);
            }
        } catch (NumberFormatException e) {
            mailSender.setPort(587);
        }
        if (username != null && !username.isBlank()) {
            mailSender.setUsername(username);
        }
        if (password != null && !password.isBlank()) {
            mailSender.setPassword(password);
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject != null ? subject : "(No subject)");
            helper.setText(body != null ? body : "", true);
            if (from != null && !from.isBlank()) {
                helper.setFrom(from);
            }
            mailSender.send(message);
            log.info("Email sent to {}", toEmail);
            return true;
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
