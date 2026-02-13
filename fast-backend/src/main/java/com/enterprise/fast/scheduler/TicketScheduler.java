package com.enterprise.fast.scheduler;

import com.enterprise.fast.domain.entity.FastProblem;
import com.enterprise.fast.domain.enums.Classification;
import com.enterprise.fast.domain.enums.RagStatus;
import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.repository.FastProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketScheduler {

    private final FastProblemRepository problemRepository;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    private static final List<TicketStatus> CLOSED_STATUSES = List.of(
            TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.REJECTED, TicketStatus.ARCHIVED
    );
    private static final int BATCH_SIZE = 500;

    /**
     * Daily at 2:00 AM - Update ticket ages for all open tickets
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void updateTicketAges() {
        log.info("Starting daily ticket age update...");

        AtomicInteger updated = new AtomicInteger(0);
        processOpenTicketsInBatches((tickets) -> {
            for (FastProblem ticket : tickets) {
                if (ticket.getCreatedDate() != null) {
                    int ageDays = (int) ChronoUnit.DAYS.between(ticket.getCreatedDate(), LocalDateTime.now());
                    ticket.setTicketAgeDays(ageDays);
                    updated.incrementAndGet();
                }
            }
        });
        log.info("Updated ages for {} tickets", updated.get());
    }

    /**
     * Daily at 2:05 AM - Set RAG status for open tickets: G = age ≤15, A = 15<age≤20, R = >20
     */
    @Scheduled(cron = "0 5 2 * * *")
    public void updateRagStatus() {
        log.info("Starting daily RAG status update...");

        AtomicInteger updated = new AtomicInteger(0);
        processOpenTicketsInBatches((tickets) -> {
            for (FastProblem ticket : tickets) {
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
                    updated.incrementAndGet();
                }
            }
        });
        log.info("Updated RAG status for {} tickets", updated.get());
    }

    /**
     * Daily at 2:15 AM - Apply A/R/P classification based on ticket age
     */
    @Scheduled(cron = "0 15 2 * * *")
    public void updateClassifications() {
        log.info("Starting daily classification update...");

        AtomicInteger updated = new AtomicInteger(0);
        processOpenTicketsInBatches((tickets) -> {
            for (FastProblem ticket : tickets) {
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
                    updated.incrementAndGet();
                }
            }
        });
        log.info("Updated classifications for {} tickets", updated.get());
    }

    /**
     * Daily at 8:00 AM - Log escalation alerts for RAG Amber and Red (and legacy Classification R/P)
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendEscalationNotifications() {
        log.info("Starting daily escalation check...");

        long ragAmberCount = problemRepository.countByStatusNotInAndDeletedFalseAndRagStatus(CLOSED_STATUSES, RagStatus.A);
        long ragRedCount = problemRepository.countByStatusNotInAndDeletedFalseAndRagStatus(CLOSED_STATUSES, RagStatus.R);

        if (ragAmberCount > 0) {
            log.warn("ESCALATION: {} tickets in RAG AMBER (>15 days) requiring attention", ragAmberCount);
        }

        if (ragRedCount > 0) {
            log.error("ESCALATION: {} tickets in RAG RED (>20 days) requiring IMMEDIATE attention", ragRedCount);
        }

        log.info("Escalation check complete. RAG Amber: {}, RAG Red: {}", ragAmberCount, ragRedCount);
    }

    /**
     * Daily at 2:20 AM - Archive CLOSED tickets that have been closed for 7+ days.
     */
    @Scheduled(cron = "0 20 2 * * *")
    public void archiveClosedTickets() {
        log.info("Starting archive of closed tickets (7+ days)...");
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        List<FastProblem> toArchive = problemRepository.findClosedForArchive(TicketStatus.CLOSED, cutoff);
        for (FastProblem ticket : toArchive) {
            ticket.setArchived(true);
            ticket.setStatus(TicketStatus.ARCHIVED);
        }
        if (!toArchive.isEmpty()) {
            problemRepository.saveAll(toArchive);
            log.info("Archived {} closed tickets", toArchive.size());
        } else {
            log.info("No closed tickets to archive");
        }
    }

    private void processOpenTicketsInBatches(java.util.function.Consumer<List<FastProblem>> mutator) {
        int page = 0;
        boolean hasNext;
        do {
            int currentPage = page;
            hasNext = Boolean.TRUE.equals(transactionTemplate.execute(status -> {
                Page<FastProblem> batch = problemRepository.findByStatusNotInAndDeletedFalse(
                        CLOSED_STATUSES,
                        PageRequest.of(currentPage, BATCH_SIZE, Sort.by("id"))
                );
                if (batch.isEmpty()) {
                    return false;
                }
                List<FastProblem> tickets = batch.getContent();
                mutator.accept(tickets);
                problemRepository.saveAll(tickets);
                problemRepository.flush();
                entityManager.clear();
                return batch.hasNext();
            }));
            page++;
        } while (hasNext);
    }
}
