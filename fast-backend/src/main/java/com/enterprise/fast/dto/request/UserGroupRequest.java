package com.enterprise.fast.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGroupRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String code;
    private String description;
}
