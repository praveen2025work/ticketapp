package com.enterprise.fast.service.impl;

import com.enterprise.fast.dto.response.AdUserResponse;
import com.enterprise.fast.dto.response.BamAuthResponse;
import com.enterprise.fast.service.BamService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Slf4j
public class BamServiceImpl implements BamService {

    @Value("${bam.sso.url:http://bam-server/authn/authenticate/sso/api}")
    private String bamSsoUrl;

    @Value("${bam.ad.url:http://ad-server/api/getADUsers}")
    private String adUsersUrl;

    @Value("${bam.phonebook.url:}")
    private String phonebookUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BamServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public BamAuthResponse getBamToken(String appName, String redirectUrl) {
        try {
            log.info("Requesting BAM token for app: {}", appName);

            // Build URL with query parameters
            String url = UriComponentsBuilder.fromHttpUrl(bamSsoUrl)
                    .queryParam("appName", appName)
                    .queryParam("redirectURL", redirectUrl)
                    .toUriString();

            // Call BAM SSO API (Windows auth is implicit)
            ResponseEntity<BamAuthResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    BamAuthResponse.class);

            BamAuthResponse bamResponse = response.getBody();

            if (bamResponse != null && "SUCCESS".equals(bamResponse.getCode())) {
                log.info("Successfully obtained BAM token");
                return bamResponse;
            } else {
                log.error("Failed to obtain BAM token: {}", bamResponse);
                throw new RuntimeException("BAM authentication failed");
            }

        } catch (Exception e) {
            log.error("Error calling BAM SSO API", e);
            throw new RuntimeException("Failed to get BAM token", e);
        }
    }

    @Override
    public boolean validateBamToken(String bamToken) {
        // In a real implementation, this would call BAM validation endpoint
        // For now, just check if token exists and is not empty
        return bamToken != null && !bamToken.isEmpty();
    }

    @Override
    public AdUserResponse getAdUserDetails() {
        try {
            log.info("Fetching AD user details");

            // Call AD API (Windows auth - credentials forwarded by proxy in production)
            ResponseEntity<String> response = restTemplate.exchange(
                    adUsersUrl,
                    HttpMethod.GET,
                    null,
                    String.class);

            String body = response.getBody();
            if (body == null || body.isBlank()) {
                throw new RuntimeException("Empty AD user response");
            }

            JsonNode root = objectMapper.readTree(body);
            String employeeId = root.has("employeeId") ? root.path("employeeId").asText(null) : null;
            String profilePhotoUrl = null;
            if (phonebookUrl != null && !phonebookUrl.isBlank() && employeeId != null && !employeeId.isBlank()) {
                profilePhotoUrl = phonebookUrl + "?brid=" + employeeId;
            }

            return AdUserResponse.builder()
                    .samAccountName(root.has("samAccountName") ? root.path("samAccountName").asText(null) : null)
                    .userName(root.has("userName") ? root.path("userName").asText(null) : null)
                    .displayName(root.has("displayName") ? root.path("displayName").asText(null) : null)
                    .distinguishedName(root.has("distinguishedName") ? root.path("distinguishedName").asText(null) : null)
                    .emailAddress(root.has("emailAddress") ? root.path("emailAddress").asText(null) : null)
                    .employeeId(employeeId)
                    .givenName(root.has("givenName") ? root.path("givenName").asText(null) : null)
                    .surname(root.has("surname") ? root.path("surname").asText(null) : null)
                    .domain(root.has("domain") && !root.path("domain").isNull() ? root.path("domain").asText(null) : null)
                    .profilePhotoUrl(profilePhotoUrl)
                    .build();
        } catch (Exception e) {
            log.error("Error calling AD API", e);
            throw new RuntimeException("Failed to get AD user details", e);
        }
    }
}
