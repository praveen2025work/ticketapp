package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.InterviewSchedule;
import com.enterprise.fast.domain.entity.InterviewScheduleEntry;
import com.enterprise.fast.dto.request.InterviewScheduleEntryRequest;
import com.enterprise.fast.dto.request.InterviewScheduleRequest;
import com.enterprise.fast.dto.response.InterviewScheduleEntryResponse;
import com.enterprise.fast.dto.response.InterviewScheduleResponse;
import com.enterprise.fast.exception.ResourceNotFoundException;
import com.enterprise.fast.repository.InterviewScheduleRepository;
import com.enterprise.fast.service.InterviewScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class InterviewScheduleServiceImpl implements InterviewScheduleService {

    private final InterviewScheduleRepository repository;

    private static final List<String> ALLOWED_TIME_SLOTS = IntStream.rangeClosed(8, 21)
            .mapToObj(hour -> String.format("%02d:00", hour))
            .toList();

    private record NormalizedEntry(
            String businessFunction,
            String applicationsUsed,
            String processImprovements,
            String techIssuesToResolve,
            String ticketRaised
    ) {}

    @Override
    @Transactional(readOnly = true)
    public List<InterviewScheduleResponse> findAll() {
        return repository.findAllByOrderByInterviewDateDescCreatedDateDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewScheduleResponse findById(Long id) {
        InterviewSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InterviewSchedule", "id", id));
        return toResponse(schedule);
    }

    @Override
    @Transactional
    public InterviewScheduleResponse create(InterviewScheduleRequest request, String username) {
        InterviewSchedule schedule = InterviewSchedule.builder()
                .businessArea(normalizeOptionalText(request.getBusinessArea()))
                .pcDirector(normalizeOptionalText(request.getPcDirector()))
                .productController(normalizeOptionalText(request.getProductController()))
                .namedPnls(normalizeOptionalText(request.getNamedPnls()))
                .location(normalizeOptionalText(request.getLocation()))
                .interviewedBy(normalizeOptionalText(request.getInterviewedBy()))
                .interviewDate(request.getInterviewDate())
                .createdBy(username)
                .updatedBy(username)
                .build();

        applyEntries(schedule, request.getEntries());
        return toResponse(repository.save(schedule));
    }

    @Override
    @Transactional
    public InterviewScheduleResponse update(Long id, InterviewScheduleRequest request, String username) {
        InterviewSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InterviewSchedule", "id", id));

        schedule.setBusinessArea(normalizeOptionalText(request.getBusinessArea()));
        schedule.setPcDirector(normalizeOptionalText(request.getPcDirector()));
        schedule.setProductController(normalizeOptionalText(request.getProductController()));
        schedule.setNamedPnls(normalizeOptionalText(request.getNamedPnls()));
        schedule.setLocation(normalizeOptionalText(request.getLocation()));
        schedule.setInterviewedBy(normalizeOptionalText(request.getInterviewedBy()));
        schedule.setInterviewDate(request.getInterviewDate());
        schedule.setUpdatedBy(username);

        applyEntries(schedule, request.getEntries());
        return toResponse(repository.save(schedule));
    }

    private void applyEntries(InterviewSchedule schedule, List<InterviewScheduleEntryRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("Interview entries are required");
        }

        Map<String, NormalizedEntry> normalizedBySlot = new LinkedHashMap<>();
        for (InterviewScheduleEntryRequest request : requests) {
            if (request == null) {
                continue;
            }
            String slot = normalizeTimeSlot(request.getTimeSlot());
            if (normalizedBySlot.containsKey(slot)) {
                throw new IllegalArgumentException("Duplicate time slot: " + slot);
            }
            normalizedBySlot.put(slot, new NormalizedEntry(
                    normalizeOptionalText(request.getBusinessFunction()),
                    normalizeOptionalText(request.getApplicationsUsed()),
                    normalizeOptionalText(request.getProcessImprovements()),
                    normalizeOptionalText(request.getTechIssuesToResolve()),
                    normalizeOptionalText(request.getTicketRaised())
            ));
        }

        List<InterviewScheduleEntry> entriesToPersist = new ArrayList<>();
        for (int i = 0; i < ALLOWED_TIME_SLOTS.size(); i++) {
            String slot = ALLOWED_TIME_SLOTS.get(i);
            NormalizedEntry entry = normalizedBySlot.get(slot);
            if (entry == null || !hasEntryData(entry)) {
                continue;
            }
            entriesToPersist.add(InterviewScheduleEntry.builder()
                    .interviewSchedule(schedule)
                    .timeSlot(slot)
                    .displayOrder(i)
                    .businessFunction(entry.businessFunction())
                    .applicationsUsed(entry.applicationsUsed())
                    .processImprovements(entry.processImprovements())
                    .techIssuesToResolve(entry.techIssuesToResolve())
                    .ticketRaised(entry.ticketRaised())
                    .build());
        }

        if (entriesToPersist.isEmpty()) {
            throw new IllegalArgumentException("At least one interview entry row is required");
        }

        schedule.getEntries().clear();
        schedule.getEntries().addAll(entriesToPersist);
    }

    private InterviewScheduleResponse toResponse(InterviewSchedule schedule) {
        Map<String, InterviewScheduleEntry> persistedBySlot = schedule.getEntries() == null
                ? Map.of()
                : schedule.getEntries().stream()
                .collect(Collectors.toMap(InterviewScheduleEntry::getTimeSlot, entry -> entry, (left, right) -> left));

        List<InterviewScheduleEntryResponse> rows = ALLOWED_TIME_SLOTS.stream()
                .map(slot -> {
                    InterviewScheduleEntry persisted = persistedBySlot.get(slot);
                    return InterviewScheduleEntryResponse.builder()
                            .id(persisted != null ? persisted.getId() : null)
                            .timeSlot(slot)
                            .businessFunction(persisted != null ? persisted.getBusinessFunction() : null)
                            .applicationsUsed(persisted != null ? persisted.getApplicationsUsed() : null)
                            .processImprovements(persisted != null ? persisted.getProcessImprovements() : null)
                            .techIssuesToResolve(persisted != null ? persisted.getTechIssuesToResolve() : null)
                            .ticketRaised(persisted != null ? persisted.getTicketRaised() : null)
                            .build();
                })
                .toList();

        return InterviewScheduleResponse.builder()
                .id(schedule.getId())
                .businessArea(schedule.getBusinessArea())
                .pcDirector(schedule.getPcDirector())
                .productController(schedule.getProductController())
                .namedPnls(schedule.getNamedPnls())
                .location(schedule.getLocation())
                .interviewedBy(schedule.getInterviewedBy())
                .interviewDate(schedule.getInterviewDate())
                .createdBy(schedule.getCreatedBy())
                .updatedBy(schedule.getUpdatedBy())
                .createdDate(schedule.getCreatedDate())
                .updatedDate(schedule.getUpdatedDate())
                .entries(rows)
                .build();
    }

    private String normalizeTimeSlot(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("timeSlot is required");
        }
        String normalized = value.trim();
        if (!ALLOWED_TIME_SLOTS.contains(normalized)) {
            throw new IllegalArgumentException("Invalid time slot. Allowed range is 08:00 to 21:00");
        }
        return normalized;
    }

    private String normalizeOptionalText(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean hasEntryData(NormalizedEntry entry) {
        return entry.businessFunction() != null
                || entry.applicationsUsed() != null
                || entry.processImprovements() != null
                || entry.techIssuesToResolve() != null
                || entry.ticketRaised() != null;
    }
}
