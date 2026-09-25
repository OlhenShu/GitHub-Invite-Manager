package com.github.manager.dto;

public record LabelCopyResult(String name, String status, String message) {
    public static LabelCopyResult created(String name) {
        return new LabelCopyResult(name, "created", null);
    }

    public static LabelCopyResult alreadyExists(String name) {
        return new LabelCopyResult(name, "already_exists", "Label already exists");
    }

    public static LabelCopyResult failed(String name, String message) {
        return new LabelCopyResult(name, "failed", message);
    }
}
