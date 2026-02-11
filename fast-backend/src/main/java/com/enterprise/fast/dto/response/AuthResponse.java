package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String username;
    private String fullName;
    private String role;
    private String region;
    /** From AD: display name */
    private String displayName;
    /** From AD: email */
    private String emailAddress;
    /** From AD: employee id (used for profile photo) */
    private String employeeId;
    /** Profile photo URL: phonebookUrl?brid=employeeId */
    private String profilePhotoUrl;
}
