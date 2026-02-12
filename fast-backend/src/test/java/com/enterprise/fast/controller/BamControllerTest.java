package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.AdUserResponse;
import com.enterprise.fast.dto.response.BamAuthResponse;
import com.enterprise.fast.service.BamService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BamControllerTest {

    @Mock
    private BamService bamService;

    @InjectMocks
    private BamController controller;

    @Test
    void getBamToken_ReturnsOk() {
        BamAuthResponse response = BamAuthResponse.builder().bamToken("jwt-token").build();
        when(bamService.getBamToken("myapp", "https://redirect")).thenReturn(response);
        ResponseEntity<BamAuthResponse> res = controller.getBamToken("myapp", "https://redirect");
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody().getBamToken()).isEqualTo("jwt-token");
        verify(bamService).getBamToken("myapp", "https://redirect");
    }

    @Test
    void getAdUser_ReturnsOk() {
        AdUserResponse response = AdUserResponse.builder().userName("aduser").displayName("AD User").build();
        when(bamService.getAdUserDetails()).thenReturn(response);
        ResponseEntity<AdUserResponse> res = controller.getAdUser();
        assertThat(res.getBody().getUserName()).isEqualTo("aduser");
        verify(bamService).getAdUserDetails();
    }
}
