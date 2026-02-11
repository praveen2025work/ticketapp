package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdUserResponse {
    private String samAccountName;
    private String userName;
    private String displayName;
    private String distinguishedName;
    private String emailAddress;
    private String employeeId;
    private String givenName;
    private String surname;
    private String domain;
    /** Full URL to load profile photo: phonebookUrl + "?brid=" + employeeId */
    private String profilePhotoUrl;
}
