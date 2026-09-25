package com.github.manager.dto;

import java.util.List;

public record IssuePreviewResponse(
        String repository,
        List<SourceIssue> issues,
        List<RepoLabel> labels
) {
}
