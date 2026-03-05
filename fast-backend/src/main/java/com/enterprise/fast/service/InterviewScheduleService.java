package com.enterprise.fast.service;

import com.enterprise.fast.dto.request.InterviewScheduleRequest;
import com.enterprise.fast.dto.response.InterviewScheduleResponse;

import java.util.List;

public interface InterviewScheduleService {

    List<InterviewScheduleResponse> findAll();

    InterviewScheduleResponse findById(Long id);

    InterviewScheduleResponse create(InterviewScheduleRequest request, String username);

    InterviewScheduleResponse update(Long id, InterviewScheduleRequest request, String username);
}
