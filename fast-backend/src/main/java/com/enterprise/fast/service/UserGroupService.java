package com.enterprise.fast.service;

import com.enterprise.fast.dto.request.UserGroupRequest;
import com.enterprise.fast.dto.response.UserGroupResponse;

import java.util.List;

public interface UserGroupService {

    List<UserGroupResponse> findAll(boolean activeOnly);

    UserGroupResponse findById(Long id);

    UserGroupResponse create(UserGroupRequest request);

    UserGroupResponse update(Long id, UserGroupRequest request);

    UserGroupResponse deactivate(Long id);
}
