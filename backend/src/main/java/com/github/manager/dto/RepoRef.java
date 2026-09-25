package com.github.manager.dto;

public record RepoRef(String owner, String repo) {

    public String fullName() {
        return owner + "/" + repo;
    }

    public static RepoRef parse(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Repository is required (owner/repo)");
        }
        String[] parts = fullName.trim().split("/", 2);
        if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new IllegalArgumentException("Invalid repository format (expected owner/repo): " + fullName);
        }
        return new RepoRef(parts[0].trim(), parts[1].trim());
    }
}
