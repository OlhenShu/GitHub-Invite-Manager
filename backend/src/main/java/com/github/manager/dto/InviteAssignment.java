package com.github.manager.dto;

import jakarta.validation.constraints.NotBlank;

public record InviteAssignment(
        @NotBlank(message = "assignment repository is required") String repository,
        @NotBlank(message = "assignment username is required") String username
) {}
