package com.enterprise.fast.exception;

import com.enterprise.fast.domain.enums.TicketStatus;

public class InvalidStateTransitionException extends RuntimeException {

    public InvalidStateTransitionException(TicketStatus from, TicketStatus to) {
        super(String.format("Invalid status transition from %s to %s", from, to));
    }
}
