package com.enterprise.fast.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    private String username;
    private String email;
    private String fullName;
    private String role;
    private String region;
    private Boolean active;
}
