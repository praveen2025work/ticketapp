package com.enterprise.fast.service;

import com.enterprise.fast.dto.response.AdUserResponse;
import com.enterprise.fast.dto.response.BamAuthResponse;

/**
 * Service for BAM SSO authentication
 */
public interface BamService {

    /**
     * Get BAM token from SSO session
     *
     * @param appName     Application name
     * @param redirectUrl Redirect URL after authentication
     * @return BAM authentication response with token
     */
    BamAuthResponse getBamToken(String appName, String redirectUrl);

    /**
     * Validate BAM token
     *
     * @param bamToken BAM token to validate
     * @return true if token is valid
     */
    boolean validateBamToken(String bamToken);

    /**
     * Get current user details from Windows AD (Windows Auth).
     *
     * @return Structured AD user with profilePhotoUrl
     */
    AdUserResponse getAdUserDetails();
}
