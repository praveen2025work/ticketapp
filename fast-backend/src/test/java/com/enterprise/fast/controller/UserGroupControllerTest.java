package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.UserGroupRequest;
import com.enterprise.fast.dto.response.UserGroupResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.service.UserGroupService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserGroupControllerTest {

    @Mock
    private UserGroupService service;

    @InjectMocks
    private UserGroupController controller;

    private static UserGroupResponse response(Long id, String name, boolean active) {
        return UserGroupResponse.builder()
                .id(id)
                .name(name)
                .code("CODE")
                .description("Desc")
                .active(active)
                .createdDate(LocalDateTime.now())
                .updatedDate(LocalDateTime.now())
                .build();
    }

    @Test
    void list_ReturnsOk() {
        when(service.findAll(true)).thenReturn(List.of(response(1L, "Finance Controllers", true)));

        ResponseEntity<List<UserGroupResponse>> res = controller.list(true);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
        verify(service).findAll(true);
    }

    @Test
    void create_Returns201() {
        UserGroupRequest request = new UserGroupRequest("Finance Controllers", "FIN", "Desc");
        when(service.create(any())).thenReturn(response(1L, "Finance Controllers", true));

        ResponseEntity<UserGroupResponse> res = controller.create(request);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody().getName()).isEqualTo("Finance Controllers");
        verify(service).create(any());
    }

    @Test
    void deactivate_ReturnsOk() {
        when(service.deactivate(1L)).thenReturn(response(1L, "Finance Controllers", false));

        ResponseEntity<UserGroupResponse> res = controller.deactivate(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().getActive()).isFalse();
        verify(service).deactivate(1L);
    }

    @Test
    void getById_WhenNotFound_Throws() {
        when(service.findById(99L)).thenThrow(new ResourceNotFoundException("UserGroup", "id", 99L));

        try {
            controller.getById(99L);
        } catch (ResourceNotFoundException ex) {
            assertThat(ex.getMessage()).contains("UserGroup");
        }
        verify(service).findById(99L);
    }
}
