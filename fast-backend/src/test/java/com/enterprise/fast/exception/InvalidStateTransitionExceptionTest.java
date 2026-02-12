package com.enterprise.fast.exception;

import com.enterprise.fast.domain.enums.TicketStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InvalidStateTransitionExceptionTest {

    @Test
    void constructor_SetsMessage() {
        InvalidStateTransitionException ex = new InvalidStateTransitionException(TicketStatus.NEW, TicketStatus.RESOLVED);
        assertThat(ex.getMessage()).contains("NEW").contains("RESOLVED");
    }
}
