package com.enterprise.fast.service;

import com.enterprise.fast.dto.response.AppSettingsResponse;

import java.util.Map;

public interface AppSettingsService {

    AppSettingsResponse getSettings(boolean maskSensitive);

    void updateSettings(Map<String, String> updates);
}
