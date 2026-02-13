package com.enterprise.fast.scheduler;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RagStatus;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.repository.FastProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketScheduler {

    private final FastProblemRepository problemRepository;

    private static final List<TicketStatus> CLOSED_STATUSES = List.of(
            TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.REJECTED
    );

    /**
     * Daily at 2:00 AM - Update ticket ages for all open tickets
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void updateTicketAges() {
        log.info("Starting daily ticket age update...");

        List<FastProblem> openTickets = problemRepository.findByStatusNotInAndDeletedFalse(CLOSED_STATUSES);
        int updated = 0;

        for (FastProblem ticket : openTickets) {
            if (ticket.getCreatedDate() != null) {
                int ageDays = (int) ChronoUnit.DAYS.between(ticket.getCreatedDate(), LocalDateTime.now());
                ticket.setTicketAgeDays(ageDays);
                updated++;
            }
        }

        problemRepository.saveAll(openTickets);
        log.info("Updated ages for {} tickets", updated);
    }

    /**
     * Daily at 2:05 AM - Set RAG status for open tickets: G = age ≤15, A = 15<age≤20, R = >20
     */
    @Scheduled(cron = "0 5 2 * * *")
    @Transactional
    public void updateRagStatus() {
        log.info("Starting daily RAG status update...");

        List<FastProblem> openTickets = problemRepository.findByStatusNotInAndDeletedFalse(CLOSED_STATUSES);
        int updated = 0;

        for (FastProblem ticket : openTickets) {
            int age = ticket.getTicketAgeDays() != null ? ticket.getTicketAgeDays() : 0;
            RagStatus newRag;
            if (age > 20) {
                newRag = RagStatus.R;
            } else if (age > 15) {
                newRag = RagStatus.A;
            } else {
                newRag = RagStatus.G;
            }
            if (ticket.getRagStatus() != newRag) {
                ticket.setRagStatus(newRag);
                updated++;
            }
        }

        problemRepository.saveAll(openTickets);
        log.info("Updated RAG status for {} tickets", updated);
    }

    /**
     * Daily at 2:15 AM - Apply A/R/P classification based on ticket age
     */
    @Scheduled(cron = "0 15 2 * * *")
    @Transactional
    public void updateClassifications() {
        log.info("Starting daily classification update...");

        List<FastProblem> openTickets = problemRepository.findByStatusNotInAndDeletedFalse(CLOSED_STATUSES);
        int updated = 0;

        for (FastProblem ticket : openTickets) {
            Classification newClassification;
            if (ticket.getTicketAgeDays() >= 20) {
                newClassification = Classification.P;
            } else if (ticket.getTicketAgeDays() >= 10) {
                newClassification = Classification.R;
            } else {
                newClassification = Classification.A;
            }

            if (ticket.getClassification() != newClassification) {
                ticket.setClassification(newClassification);
                updated++;
            }
        }

        problemRepository.saveAll(openTickets);
        log.info("Updated classifications for {} tickets", updated);
    }

    /**
     * Daily at 8:00 AM - Log escalation alerts for RAG Amber and Red (and legacy Classification R/P)
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional(readOnly = true)
    public void sendEscalationNotifications() {
        log.info("Starting daily escalation check...");

        List<FastProblem> openTickets = problemRepository.findByStatusNotInAndDeletedFalse(CLOSED_STATUSES);

        long ragAmberCount = openTickets.stream()
                .filter(t -> t.getRagStatus() == RagStatus.A)
                .count();

        long ragRedCount = openTickets.stream()
                .filter(t -> t.getRagStatus() == RagStatus.R)
                .count();

        if (ragAmberCount > 0) {
            log.warn("ESCALATION: {} tickets in RAG AMBER (>15 days) requiring attention", ragAmberCount);
        }

        if (ragRedCount > 0) {
            log.error("ESCALATION: {} tickets in RAG RED (>20 days) requiring IMMEDIATE attention", ragRedCount);
        }

        log.info("Escalation check complete. RAG Amber: {}, RAG Red: {}", ragAmberCount, ragRedCount);
    }
}
