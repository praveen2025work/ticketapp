package com.enterprise.fast.controller;

import com.enterprise.fast.domain.entity.Application;
import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.dto.request.UpdateUserRequest;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.ApplicationRepository;
import com.enterprise.fast.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.enterprise.fast.domain.enums.UserRole.READ_ONLY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private UserController controller;

    @BeforeEach
    void setAuth() {
        Authentication auth = new UsernamePasswordAuthenticationToken("testuser", null,
                List.of(new SimpleGrantedAuthority("ROLE_READ_ONLY")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    private static User user(Long id, String username) {
        User u = User.builder()
                .id(id)
                .username(username)
                .fullName("Full Name")
                .email("u@test.com")
                .role(READ_ONLY)
                .region("AMER")
                .active(true)
                .createdDate(LocalDateTime.now())
                .applications(new ArrayList<>())
                .build();
        return u;
    }

    @Test
    void listUsers_ReturnsPaginated() {
        Page<User> page = new PageImpl<>(List.of(user(1L, "user1")), PageRequest.of(0, 20), 1);
        when(userRepository.findAllWithApplications(any(PageRequest.class))).thenReturn(page);
        ResponseEntity<?> res = controller.listUsers(0, 20);
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody()).isNotNull();
        verify(userRepository).findAllWithApplications(any(PageRequest.class));
    }

    @Test
    void getCurrentUser_WhenUserInDb_ReturnsUserDetails() {
        User u = user(1L, "testuser");
        u.setFullName("DB User");
        u.setRegion("EMEA");
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(u));
        ResponseEntity<?> res = controller.getCurrentUser();
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody()).hasFieldOrPropertyWithValue("username", "testuser");
        verify(userRepository).findByUsernameIgnoreCase("testuser");
    }

    @Test
    void getCurrentUser_WhenUserNotInDb_ReturnsMinimalFromAuth() {
        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.empty());
        ResponseEntity<?> res = controller.getCurrentUser();
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody()).hasFieldOrPropertyWithValue("username", "testuser");
        verify(userRepository).findByUsernameIgnoreCase("testuser");
    }

    @Test
    void updateUserApplications_WhenUserExists_ReturnsOk() {
        User u = user(1L, "user1");
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(applicationRepository.findAllById(List.of(10L))).thenReturn(
                List.of(Application.builder().id(10L).name("App").code("A").build()));
        when(userRepository.save(any(User.class))).thenReturn(u);
        ResponseEntity<?> res = controller.updateUserApplications(1L, List.of(10L));
        assertThat(res.getStatusCode().value()).isEqualTo(200);
        verify(userRepository).findById(1L);
        verify(userRepository).save(u);
    }

    @Test
    void updateUserApplications_WhenUserNotExists_Throws() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        try {
            controller.updateUserApplications(999L, List.of(1L));
        } catch (ResourceNotFoundException e) {
            assertThat(e.getMessage()).contains("User");
        }
        verify(userRepository).findById(999L);
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_WhenUserExists_ReturnsOk() {
        User u = user(1L, "user1");
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.findByUsernameIgnoreCase("user1updated")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user1updated@test.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(u);

        UpdateUserRequest request = new UpdateUserRequest(
                "User1Updated",
                "user1updated@test.com",
                "User One Updated",
                "TECH_LEAD",
                "emea",
                false
        );

        ResponseEntity<?> res = controller.updateUser(1L, request);

        assertThat(res.getStatusCode().value()).isEqualTo(200);
        verify(userRepository).findById(1L);
        verify(userRepository).save(u);
        assertThat(u.getUsername()).isEqualTo("user1updated");
        assertThat(u.getEmail()).isEqualTo("user1updated@test.com");
        assertThat(u.getFullName()).isEqualTo("User One Updated");
        assertThat(u.getRole().name()).isEqualTo("TECH_LEAD");
        assertThat(u.getRegion()).isEqualTo("EMEA");
        assertThat(u.getActive()).isFalse();
    }

    @Test
    void updateUser_WhenDuplicateEmail_Throws() {
        User existing = user(1L, "user1");
        User other = user(2L, "user2");
        other.setEmail("taken@test.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.findByEmail("taken@test.com")).thenReturn(Optional.of(other));

        try {
            controller.updateUser(1L, new UpdateUserRequest(null, "taken@test.com", null, null, null, null));
        } catch (IllegalArgumentException e) {
            assertThat(e.getMessage()).contains("Email already exists");
        }

        verify(userRepository).findById(1L);
        verify(userRepository, never()).save(any());
    }
}
