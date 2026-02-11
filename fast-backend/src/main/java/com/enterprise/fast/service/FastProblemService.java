package com.enterprise.fast.service;

import com.enterprise.fast.dto.request.CreateFastProblemRequest;
import com.enterprise.fast.dto.request.UpdateFastProblemRequest;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.dto.response.PagedResponse;

import java.util.List;

public interface FastProblemService {

    FastProblemResponse create(CreateFastProblemRequest request, String username);

    FastProblemResponse getById(Long id);

    PagedResponse<FastProblemResponse> getAll(int page, int size, String sortBy, String direction);

    PagedResponse<FastProblemResponse> getByRegion(String regionCode, int page, int size);

    PagedResponse<FastProblemResponse> getByClassification(String classification, int page, int size);

    PagedResponse<FastProblemResponse> getByStatus(String status, int page, int size);

    PagedResponse<FastProblemResponse> search(String keyword, int page, int size);

    PagedResponse<FastProblemResponse> findWithFilters(String keyword, String regionCode, String classification,
                                                       String application, java.time.LocalDate fromDate, java.time.LocalDate toDate,
                                                       String status, int page, int size, String sortBy, String direction);

    List<FastProblemResponse> exportWithFilters(String keyword, String regionCode, String classification,
                                                String application, java.time.LocalDate fromDate, java.time.LocalDate toDate,
                                                String status, int limit);

    FastProblemResponse update(Long id, UpdateFastProblemRequest request, String username);

    FastProblemResponse updateStatus(Long id, String newStatus, String username);

    void softDelete(Long id, String username);
}
