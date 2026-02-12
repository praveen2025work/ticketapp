package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppSettingsResponse {

    /** Key-value map; sensitive values (e.g. smtpPassword) may be masked. */
    private Map<String, String> settings;
}
