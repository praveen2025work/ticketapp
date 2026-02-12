package com.enterprise.fast.service;

import com.enterprise.fast.dto.request.ApplicationRequest;
import com.enterprise.fast.dto.response.ApplicationResponse;

import java.util.List;

public interface ApplicationService {

    List<ApplicationResponse> findAll();

    ApplicationResponse findById(Long id);

    ApplicationResponse create(ApplicationRequest request);

    ApplicationResponse update(Long id, ApplicationRequest request);

    void deleteById(Long id);
}
