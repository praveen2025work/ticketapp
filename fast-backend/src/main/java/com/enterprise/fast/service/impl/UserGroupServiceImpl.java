package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.UserGroup;
import com.enterprise.fast.dto.request.UserGroupRequest;
import com.enterprise.fast.dto.response.UserGroupResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.UserGroupRepository;
import com.enterprise.fast.service.UserGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserGroupServiceImpl implements UserGroupService {

    private final UserGroupRepository repository;

    private static UserGroupResponse toResponse(UserGroup group) {
        return UserGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .code(group.getCode())
                .description(group.getDescription())
                .active(group.getActive())
                .createdDate(group.getCreatedDate())
                .updatedDate(group.getUpdatedDate())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserGroupResponse> findAll(boolean activeOnly) {
        List<UserGroup> groups = activeOnly
                ? repository.findByActiveTrueOrderByNameAsc()
                : repository.findAllByOrderByNameAsc();
        return groups.stream().map(UserGroupServiceImpl::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserGroupResponse findById(Long id) {
        UserGroup group = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UserGroup", "id", id));
        return toResponse(group);
    }

    @Override
    @Transactional
    public UserGroupResponse create(UserGroupRequest request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new IllegalArgumentException("User group name is required");
        }
        if (repository.findByNameIgnoreCase(name).isPresent()) {
            throw new IllegalArgumentException("User group with name '" + name + "' already exists");
        }
        UserGroup saved = repository.save(UserGroup.builder()
                .name(name)
                .code(request.getCode() != null && !request.getCode().isBlank() ? request.getCode().trim() : null)
                .description(request.getDescription() != null && !request.getDescription().isBlank() ? request.getDescription().trim() : null)
                .active(true)
                .build());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public UserGroupResponse update(Long id, UserGroupRequest request) {
        UserGroup group = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UserGroup", "id", id));
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new IllegalArgumentException("User group name is required");
        }
        repository.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("User group with name '" + name + "' already exists");
                });
        group.setName(name);
        group.setCode(request.getCode() != null && !request.getCode().isBlank() ? request.getCode().trim() : null);
        group.setDescription(request.getDescription() != null && !request.getDescription().isBlank() ? request.getDescription().trim() : null);
        return toResponse(repository.save(group));
    }

    @Override
    @Transactional
    public UserGroupResponse deactivate(Long id) {
        UserGroup group = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UserGroup", "id", id));
        group.setActive(false);
        return toResponse(repository.save(group));
    }
}
