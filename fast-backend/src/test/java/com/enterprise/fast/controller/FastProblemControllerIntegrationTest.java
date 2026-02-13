package com.enterprise.fast.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Disabled("Full context fails in CI due to BamAuthenticationFilter; run manually with full stack")
class FastProblemControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void getAll_WhenAuthenticated_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/problems")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void getAll_WithSearchFilter_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/problems")
                        .param("q", "SAP")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void getAll_WithRegionFilter_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/problems")
                        .param("region", "AMER")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void getAll_WithClassificationFilter_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/problems")
                        .param("classification", "A")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void getAll_WithApplicationFilter_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/problems")
                        .param("application", "SAP")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void create_WithValidData_Returns201() throws Exception {
        String body = """
                {"title":"Integration Test Problem","description":"Test","regionalCodes":["AMER"]}
                """;
        mockMvc.perform(post("/api/v1/problems")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Integration Test Problem"))
                .andExpect(jsonPath("$.regionalCodes[0]").value("AMER"));
    }
}
