package com.enterprise.fast.exception;

import com.enterprise.fast.domain.enums.TicketStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InvalidStateTransitionExceptionTest {

    @Test
    void constructor_SetsMessage() {
        InvalidStateTransitionException ex = new InvalidStateTransitionException(TicketStatus.BACKLOG, TicketStatus.RESOLVED);
        assertThat(ex.getMessage()).contains("BACKLOG").contains("RESOLVED");
    }
}
