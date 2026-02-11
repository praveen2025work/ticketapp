package com.enterprise.fast.scheduler;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
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
     * Daily at 8:00 AM - Log escalation alerts for R and P classified tickets
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional(readOnly = true)
    public void sendEscalationNotifications() {
        log.info("Starting daily escalation check...");

        List<FastProblem> openTickets = problemRepository.findByStatusNotInAndDeletedFalse(CLOSED_STATUSES);

        long reviewCount = openTickets.stream()
                .filter(t -> t.getClassification() == Classification.R)
                .count();

        long priorityCount = openTickets.stream()
                .filter(t -> t.getClassification() == Classification.P)
                .count();

        if (reviewCount > 0) {
            log.warn("ESCALATION: {} tickets in REVIEW (R) classification requiring attention", reviewCount);
        }

        if (priorityCount > 0) {
            log.error("ESCALATION: {} tickets in PRIORITY (P) classification requiring IMMEDIATE attention", priorityCount);
        }

        log.info("Escalation check complete. Review: {}, Priority: {}", reviewCount, priorityCount);
    }
}
