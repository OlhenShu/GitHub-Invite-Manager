package com.github.manager.dto;

import java.util.List;

public record IssueCopyResult(
        int sourceNumber,
        String title,
        String status,
        String message,
        String url,
        List<String> labels
) {
    public static IssueCopyResult copied(int sourceNumber, String title, String url, List<String> labels) {
        return new IssueCopyResult(sourceNumber, title, "copied", null, url, labels);
    }

    public static IssueCopyResult skipped(int sourceNumber, String title, String message, List<String> labels) {
        return new IssueCopyResult(sourceNumber, title, "skipped", message, null, labels);
    }

    public static IssueCopyResult failed(int sourceNumber, String title, String message, List<String> labels) {
        return new IssueCopyResult(sourceNumber, title, "failed", message, null, labels);
    }
}
