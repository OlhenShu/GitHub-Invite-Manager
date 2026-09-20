package com.github.manager.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public record CreateReposRequest(
        @NotBlank(message = "templateOwner is required") String templateOwner,
        @NotBlank(message = "templateRepo is required") String templateRepo,
        String targetOrg,
        @NotNull(message = "namingMode is required") NamingMode namingMode,

        // PATTERN mode fields
        String baseName,
        @Min(value = 1, message = "count must be at least 1")
        @Max(value = 200, message = "count must not exceed 200")
        Integer count,
        Integer startIndex,
        @Min(value = 1, message = "padding must be at least 1")
        @Max(value = 10, message = "padding must not exceed 10")
        Integer padding,

        // LIST mode fields
        List<String> repoNames,

        // Common
        @NotBlank(message = "visibility is required") String visibility,
        boolean includeAllBranches,
        String description
) {
    public CreateReposRequest {
        if (startIndex == null) startIndex = 1;
        if (padding == null) padding = 2;
    }
}