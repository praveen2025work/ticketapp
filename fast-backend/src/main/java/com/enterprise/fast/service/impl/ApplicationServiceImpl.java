package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.Application;
import com.enterprise.fast.dto.request.ApplicationRequest;
import com.enterprise.fast.dto.response.ApplicationResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.ApplicationRepository;
import com.enterprise.fast.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;

    private static ApplicationResponse toResponse(Application app) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .name(app.getName())
                .code(app.getCode())
                .description(app.getDescription())
                .createdDate(app.getCreatedDate())
                .updatedDate(app.getUpdatedDate())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationResponse> findAll() {
        return applicationRepository.findAllByOrderByNameAsc().stream()
                .map(ApplicationServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicationResponse findById(Long id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        return toResponse(app);
    }

    @Override
    @Transactional
    public ApplicationResponse create(ApplicationRequest request) {
        if (applicationRepository.findByName(request.getName().trim()).isPresent()) {
            throw new IllegalArgumentException("Application with name '" + request.getName() + "' already exists");
        }
        Application app = Application.builder()
                .name(request.getName().trim())
                .code(request.getCode() != null ? request.getCode().trim() : null)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .build();
        return toResponse(applicationRepository.save(app));
    }

    @Override
    @Transactional
    public ApplicationResponse update(Long id, ApplicationRequest request) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        app.setName(request.getName().trim());
        app.setCode(request.getCode() != null ? request.getCode().trim() : null);
        app.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        return toResponse(applicationRepository.save(app));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!applicationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Application", "id", id);
        }
        applicationRepository.deleteById(id);
    }
}
