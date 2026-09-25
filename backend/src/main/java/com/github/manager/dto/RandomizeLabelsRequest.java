package com.github.manager.dto;

import jakarta.validation.constraints.NotBlank;

public record RandomizeLabelsRequest(
        @NotBlank(message = "repository is required") String repository
) {
}
