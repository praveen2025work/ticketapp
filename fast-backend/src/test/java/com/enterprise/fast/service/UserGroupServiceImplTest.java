package com.enterprise.fast.service;

import com.enterprise.fast.domain.entity.UserGroup;
import com.enterprise.fast.dto.request.UserGroupRequest;
import com.enterprise.fast.dto.response.UserGroupResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.UserGroupRepository;
import com.enterprise.fast.service.impl.UserGroupServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserGroupServiceImplTest {

    @Mock
    private UserGroupRepository repository;

    @InjectMocks
    private UserGroupServiceImpl service;

    private UserGroup group;

    @BeforeEach
    void setup() {
        group = UserGroup.builder()
                .id(1L)
                .name("Finance Controllers")
                .code("FIN")
                .description("Desc")
                .active(true)
                .createdDate(LocalDateTime.now())
                .updatedDate(LocalDateTime.now())
                .build();
    }

    @Test
    void findAll_ActiveOnly_ReturnsActiveRecords() {
        when(repository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(group));

        List<UserGroupResponse> result = service.findAll(true);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Finance Controllers");
    }

    @Test
    void create_DuplicateName_Throws() {
        when(repository.findByNameIgnoreCase("Finance Controllers")).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> service.create(new UserGroupRequest("Finance Controllers", "FIN", "Desc")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");

        verify(repository, never()).save(any());
    }

    @Test
    void create_NewRecord_Succeeds() {
        when(repository.findByNameIgnoreCase("Operations")).thenReturn(Optional.empty());
        when(repository.save(any(UserGroup.class))).thenAnswer(invocation -> {
            UserGroup toSave = invocation.getArgument(0);
            toSave.setId(2L);
            return toSave;
        });

        UserGroupResponse result = service.create(new UserGroupRequest("Operations", "OPS", "Ops users"));

        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getName()).isEqualTo("Operations");
    }

    @Test
    void deactivate_NotFound_Throws() {
        when(repository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deactivate(10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
