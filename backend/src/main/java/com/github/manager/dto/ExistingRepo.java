package com.github.manager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ExistingRepo(
        String fullName,
        String htmlUrl,
        @JsonProperty("private") boolean isPrivate,
        String owner,
        String ownerType
) {
}
