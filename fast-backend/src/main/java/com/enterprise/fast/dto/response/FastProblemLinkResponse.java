package com.enterprise.fast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FastProblemLinkResponse {

    private Long id;
    private String label;
    private String url;
    private String linkType;
}
