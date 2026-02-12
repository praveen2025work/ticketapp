package com.enterprise.fast.service.impl;

import com.enterprise.fast.domain.entity.AppSetting;
import com.enterprise.fast.dto.response.AppSettingsResponse;
import com.enterprise.fast.repository.AppSettingRepository;
import com.enterprise.fast.service.AppSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AppSettingsServiceImpl implements AppSettingsService {

    private static final String MASK = "********";

    private final AppSettingRepository repository;

    @Override
    @Transactional(readOnly = true)
    public AppSettingsResponse getSettings(boolean maskSensitive) {
        List<AppSetting> all = repository.findAll();
        Map<String, String> map = new LinkedHashMap<>();
        for (AppSetting s : all) {
            String value = s.getSettingValue();
            if (maskSensitive && "smtpPassword".equals(s.getSettingKey()) && value != null && !value.isEmpty()) {
                value = MASK;
            }
            map.put(s.getSettingKey(), value != null ? value : "");
        }
        return AppSettingsResponse.builder().settings(map).build();
    }

    @Override
    @Transactional
    public void updateSettings(Map<String, String> updates) {
        if (updates == null || updates.isEmpty()) return;
        for (Map.Entry<String, String> e : updates.entrySet()) {
            repository.findBySettingKey(e.getKey()).ifPresent(s -> {
                // Do not overwrite password with mask
                if ("smtpPassword".equals(e.getKey()) && MASK.equals(e.getValue())) return;
                s.setSettingValue(e.getValue() != null ? e.getValue() : "");
                repository.save(s);
            });
        }
    }
}
