package com.github.manager.dto;

import java.util.List;
import java.util.Map;

public record CopyIssuesResponse(
        List<IssueCopyResult> results,
        List<LabelCopyResult> labels,
        Map<String, Long> summary,
        Map<String, Long> labelSummary
) {
    public static CopyIssuesResponse of(List<IssueCopyResult> results, List<LabelCopyResult> labels) {
        return new CopyIssuesResponse(
                results,
                labels,
                Map.of(
                        "total", (long) results.size(),
                        "copied", results.stream().filter(r -> "copied".equals(r.status())).count(),
                        "skipped", results.stream().filter(r -> "skipped".equals(r.status())).count(),
                        "failed", results.stream().filter(r -> "failed".equals(r.status())).count()
                ),
                Map.of(
                        "total", (long) labels.size(),
                        "created", labels.stream().filter(r -> "created".equals(r.status())).count(),
                        "already_exists", labels.stream().filter(r -> "already_exists".equals(r.status())).count(),
                        "failed", labels.stream().filter(r -> "failed".equals(r.status())).count()
                )
        );
    }
}
