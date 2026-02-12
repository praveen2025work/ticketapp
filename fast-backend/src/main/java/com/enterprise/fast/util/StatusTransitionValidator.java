package com.enterprise.fast.util;

import com.enterprise.fast.domain.enums.TicketStatus;
import com.enterprise.fast.exception.InvalidStateTransitionException;

import java.util.Map;
import java.util.Set;

public final class StatusTransitionValidator {

    private static final Map<TicketStatus, Set<TicketStatus>> VALID_TRANSITIONS = Map.of(
            TicketStatus.NEW, Set.of(TicketStatus.ASSIGNED, TicketStatus.REJECTED, TicketStatus.CLOSED),
            TicketStatus.ASSIGNED, Set.of(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED, TicketStatus.CLOSED),
            TicketStatus.IN_PROGRESS, Set.of(TicketStatus.ROOT_CAUSE_IDENTIFIED),
            TicketStatus.ROOT_CAUSE_IDENTIFIED, Set.of(TicketStatus.FIX_IN_PROGRESS),
            TicketStatus.FIX_IN_PROGRESS, Set.of(TicketStatus.RESOLVED),
            TicketStatus.RESOLVED, Set.of(TicketStatus.CLOSED)
    );

    private StatusTransitionValidator() {
    }

    public static void validate(TicketStatus from, TicketStatus to) {
        Set<TicketStatus> allowed = VALID_TRANSITIONS.get(from);
        if (allowed == null || !allowed.contains(to)) {
            throw new InvalidStateTransitionException(from, to);
        }
    }
}
