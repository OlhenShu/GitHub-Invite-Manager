package com.github.manager.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CopyIssuesRequest(
        @NotBlank(message = "sourceRepo is required") String sourceRepo,
        @NotBlank(message = "targetRepo is required") String targetRepo,
        boolean includeClosed,
        boolean preserveClosedState,
        List<Integer> issueNumbers
) {
}
