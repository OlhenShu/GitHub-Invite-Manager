package com.github.manager.dto;

public record LabelColorResult(
        String name,
        String previousColor,
        String color,
        String status,
        String message
) {
    public static LabelColorResult updated(String name, String previousColor, String color) {
        return new LabelColorResult(name, previousColor, color, "updated", null);
    }

    public static LabelColorResult failed(String name, String previousColor, String color, String message) {
        return new LabelColorResult(name, previousColor, color, "failed", message);
    }
}
