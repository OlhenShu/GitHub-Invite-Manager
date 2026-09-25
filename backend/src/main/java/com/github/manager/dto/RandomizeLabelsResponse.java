package com.github.manager.dto;

import java.util.List;
import java.util.Map;

public record RandomizeLabelsResponse(
        String repository,
        List<LabelColorResult> results,
        Map<String, Long> summary
) {
    public static RandomizeLabelsResponse of(String repository, List<LabelColorResult> results) {
        return new RandomizeLabelsResponse(
                repository,
                results,
                Map.of(
                        "total", (long) results.size(),
                        "updated", results.stream().filter(r -> "updated".equals(r.status())).count(),
                        "failed", results.stream().filter(r -> "failed".equals(r.status())).count()
                )
        );
    }
}
