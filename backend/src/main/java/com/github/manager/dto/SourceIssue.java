package com.github.manager.dto;

import java.util.List;

public record SourceIssue(
        int number,
        String title,
        String body,
        String state,
        String url,
        List<String> labels
) {
}
