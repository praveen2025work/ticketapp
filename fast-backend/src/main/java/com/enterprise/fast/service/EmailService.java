package com.enterprise.fast.service;

/**
 * Sends email using SMTP configuration from app settings.
 */
public interface EmailService {

    /**
     * Send an email. Uses SMTP settings from app_settings (smtpHost, smtpPort, smtpUsername, smtpPassword, smtpFrom).
     * @return true if sent successfully
     */
    boolean sendEmail(String toEmail, String subject, String body);
}
