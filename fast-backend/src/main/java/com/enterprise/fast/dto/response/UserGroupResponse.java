package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGroupResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private Boolean active;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
