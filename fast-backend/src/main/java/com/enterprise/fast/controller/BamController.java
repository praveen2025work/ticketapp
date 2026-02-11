package com.enterprise.fast.controller;

import com.enterprise.fast.dto.response.AdUserResponse;
import com.enterprise.fast.dto.response.BamAuthResponse;
import com.enterprise.fast.service.BamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for BAM SSO authentication endpoints
 */
@RestController
@RequestMapping("/api/v1/bam")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "BAM Authentication", description = "BAM SSO and Windows AD integration endpoints")
public class BamController {

    private final BamService bamService;

    @GetMapping("/token")
    @Operation(summary = "Get BAM token from SSO session")
    public ResponseEntity<BamAuthResponse> getBamToken(
            @RequestParam String appName,
            @RequestParam String redirectURL) {
        log.info("Requesting BAM token for app: {}", appName);
        BamAuthResponse response = bamService.getBamToken(appName, redirectURL);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ad-user")
    @Operation(summary = "Get Windows AD user details (Windows Auth)")
    public ResponseEntity<AdUserResponse> getAdUser() {
        log.info("Fetching AD user details");
        AdUserResponse adUser = bamService.getAdUserDetails();
        return ResponseEntity.ok(adUser);
    }
}
