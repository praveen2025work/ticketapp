package com.enterprise.fast.exception;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ResourceNotFoundExceptionTest {

    @Test
    void constructor_SetsMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Application", "id", 1L);
        assertThat(ex.getMessage()).contains("Application").contains("id").contains("1");
    }
}
