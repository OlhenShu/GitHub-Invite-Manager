package com.github.manager.dto;

public record RepoResult(
        String repoName,
        String status,
        String message,
        String url,
        String fullName
) {
    public static RepoResult created(String repoName, String url, String fullName) {
        return new RepoResult(repoName, "created", null, url, fullName);
    }

    public static RepoResult alreadyExists(String repoName, String fullName) {
        return new RepoResult(repoName, "already_exists", "Repository already exists", null, fullName);
    }

    public static RepoResult failed(String repoName, String message, String fullName) {
        return new RepoResult(repoName, "failed", message, null, fullName);
    }
}
