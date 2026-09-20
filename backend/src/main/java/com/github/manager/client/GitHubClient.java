package com.github.manager.client;

import com.github.manager.dto.AuthenticatedUser;
import com.github.manager.dto.ExistingRepo;
import com.github.manager.dto.InviteResult;
import com.github.manager.dto.RepoResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GitHubClient {

    private static final Logger log = LoggerFactory.getLogger(GitHubClient.class);
    private static final int MAX_RETRIES = 3;
    private static final long BASE_BACKOFF_MS = 1000;
    private static final int PAGE_SIZE = 100;
    private static final int MAX_PAGES = 10;
    private static final Pattern NEXT_LINK = Pattern.compile("<([^>]+)>;\\s*rel=\"next\"");

    private final RestClient restClient;

    @Value("${github.token:}")
    private String envToken;

    public GitHubClient() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .build();
    }

    private String resolveToken(String requestToken) {
        String token = (requestToken != null && !requestToken.isBlank()) ? requestToken : envToken;
        if (token == null || token.isBlank()) {
            throw new IllegalStateException(
                    "GitHub token is required. Set GITHUB_TOKEN env variable or provide X-GitHub-Token header.");
        }
        return token;
    }

    @SuppressWarnings("unchecked")
    public AuthenticatedUser getAuthenticatedUser(String token) {
        String resolved = resolveToken(token);
        try {
            ResponseEntity<Map> response = restClient.get()
                    .uri("/user")
                    .header("Authorization", "Bearer " + resolved)
                    .retrieve()
                    .toEntity(Map.class);

            Map<?, ?> body = response.getBody();
            if (body == null || body.get("login") == null) {
                throw new IllegalStateException("GitHub did not return the authenticated user");
            }
            return new AuthenticatedUser((String) body.get("login"), (String) body.get("html_url"));
        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 401) {
                throw new IllegalStateException("Invalid token (401 Unauthorized)");
            }
            throw new IllegalArgumentException(
                    "Could not resolve GitHub user: HTTP " + status + ": " + truncate(e.getResponseBodyAsString()));
        }
    }

    @SuppressWarnings("unchecked")
    public RepoResult createRepoFromTemplate(
            String token,
            String templateOwner, String templateRepo,
            String targetOwner, String repoName,
            String description, boolean includeAllBranches, boolean isPrivate,
            String fallbackOwner) {

        String resolved = resolveToken(token);
        String expectedFullName = fullNameOf(fallbackOwner, repoName);

        Map<String, Object> body = new HashMap<>();
        if (targetOwner != null && !targetOwner.isBlank()) {
            body.put("owner", targetOwner);
        }
        body.put("name", repoName);
        body.put("include_all_branches", includeAllBranches);
        body.put("private", isPrivate);
        if (description != null && !description.isBlank()) {
            body.put("description", description.replace("{name}", repoName));
        }

        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                ResponseEntity<Map> response = restClient.post()
                        .uri("/repos/{to}/{tr}/generate", templateOwner, templateRepo)
                        .header("Authorization", "Bearer " + resolved)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .toEntity(Map.class);

                String url = null;
                String fullName = expectedFullName;
                if (response.getBody() != null) {
                    url = (String) response.getBody().get("html_url");
                    Object apiFullName = response.getBody().get("full_name");
                    if (apiFullName instanceof String s && !s.isBlank()) {
                        fullName = s;
                    }
                }
                return RepoResult.created(repoName, url, fullName);

            } catch (HttpClientErrorException e) {
                int status = e.getStatusCode().value();
                if (status == 422) {
                    return RepoResult.alreadyExists(repoName, expectedFullName);
                }
                if (status == 401) {
                    return RepoResult.failed(repoName, "Invalid token (401 Unauthorized)", expectedFullName);
                }
                if ((status == 403 || status == 429) && attempt < MAX_RETRIES - 1) {
                    log.warn("Rate limited ({}), attempt {}/{}. Backing off...", status, attempt + 1, MAX_RETRIES);
                    sleep(backoff(attempt));
                    continue;
                }
                return RepoResult.failed(repoName,
                        "HTTP " + status + ": " + truncate(e.getResponseBodyAsString()), expectedFullName);

            } catch (HttpServerErrorException e) {
                if (attempt < MAX_RETRIES - 1) {
                    sleep(backoff(attempt));
                    continue;
                }
                return RepoResult.failed(repoName, "Server error " + e.getStatusCode(), expectedFullName);
            } catch (Exception e) {
                return RepoResult.failed(repoName, "Unexpected error: " + e.getMessage(), expectedFullName);
            }
        }
        return RepoResult.failed(repoName, "Max retries exceeded", expectedFullName);
    }

    public InviteResult inviteCollaborator(
            String token, String owner, String repo, String username, String permission) {

        String resolved = resolveToken(token);
        String repository = owner + "/" + repo;
        InviteResult withPermission = putCollaborator(resolved, repository, owner, repo, username, permission);
        if (!"failed".equals(withPermission.status())) {
            return withPermission;
        }
        // Personal (non-org) repos reject the permission field. Retry without it.
        if (permission != null && !permission.isBlank()
                && withPermission.message() != null
                && withPermission.message().contains("422")) {
            log.info("Retrying invite of {} to {} without permission (personal repo)", username, repository);
            return putCollaborator(resolved, repository, owner, repo, username, null);
        }
        return withPermission;
    }

    private InviteResult putCollaborator(
            String resolved, String repository, String owner, String repo, String username, String permission) {

        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                var request = restClient.put()
                        .uri("/repos/{owner}/{repo}/collaborators/{username}", owner, repo, username)
                        .header("Authorization", "Bearer " + resolved)
                        .contentType(MediaType.APPLICATION_JSON);
                ResponseEntity<Void> response = (permission == null || permission.isBlank()
                        ? request.retrieve()
                        : request.body(Map.of("permission", permission)).retrieve())
                        .toBodilessEntity();

                if (response.getStatusCode().value() == 204) {
                    return InviteResult.alreadyCollaborator(repository, username);
                }
                return InviteResult.invited(repository, username);

            } catch (HttpClientErrorException e) {
                int status = e.getStatusCode().value();
                if (status == 404) {
                    return InviteResult.userNotFound(repository, username);
                }
                if (status == 401) {
                    return InviteResult.failed(repository, username, "Invalid token (401 Unauthorized)");
                }
                if ((status == 403 || status == 429) && attempt < MAX_RETRIES - 1) {
                    log.warn("Rate limited ({}), attempt {}/{}. Backing off...", status, attempt + 1, MAX_RETRIES);
                    sleep(backoff(attempt));
                    continue;
                }
                return InviteResult.failed(repository, username,
                        "HTTP " + status + ": " + truncate(e.getResponseBodyAsString()));

            } catch (HttpServerErrorException e) {
                if (attempt < MAX_RETRIES - 1) {
                    sleep(backoff(attempt));
                    continue;
                }
                return InviteResult.failed(repository, username, "Server error " + e.getStatusCode());
            } catch (Exception e) {
                return InviteResult.failed(repository, username, "Unexpected error: " + e.getMessage());
            }
        }
        return InviteResult.failed(repository, username, "Max retries exceeded");
    }

    public List<ExistingRepo> listRepos(String token, String org) {
        String resolved = resolveToken(token);
        String firstPath = (org != null && !org.isBlank())
                ? "/orgs/" + org.trim() + "/repos?per_page=" + PAGE_SIZE + "&sort=updated"
                : "/user/repos?per_page=" + PAGE_SIZE + "&sort=updated&affiliation=owner";
        return fetchRepoPages(resolved, firstPath);
    }

    @SuppressWarnings("unchecked")
    private List<ExistingRepo> fetchRepoPages(String resolvedToken, String firstPath) {
        List<ExistingRepo> all = new ArrayList<>();
        String nextPath = firstPath;

        for (int page = 0; page < MAX_PAGES && nextPath != null; page++) {
            try {
                ResponseEntity<List> response = restClient.get()
                        .uri(nextPath)
                        .header("Authorization", "Bearer " + resolvedToken)
                        .retrieve()
                        .toEntity(List.class);

                List<?> body = response.getBody();
                if (body == null || body.isEmpty()) {
                    break;
                }
                for (Object item : body) {
                    if (item instanceof Map<?, ?> map) {
                        ExistingRepo repo = toExistingRepo(map);
                        if (repo != null) {
                            all.add(repo);
                        }
                    }
                }
                if (body.size() < PAGE_SIZE) {
                    break;
                }
                nextPath = nextLinkPath(response.getHeaders().getFirst("Link"));
            } catch (HttpClientErrorException e) {
                int status = e.getStatusCode().value();
                if (status == 401) {
                    throw new IllegalStateException("Invalid token (401 Unauthorized)");
                }
                if (status == 404) {
                    throw new IllegalArgumentException(
                            "Organization or repositories not found, or the token does not have access");
                }
                throw new IllegalArgumentException(
                        "Could not list repositories: HTTP " + status + ": " + truncate(e.getResponseBodyAsString()));
            }
        }
        return all;
    }

    private ExistingRepo toExistingRepo(Map<?, ?> map) {
        Object fullName = map.get("full_name");
        if (!(fullName instanceof String name) || name.isBlank()) {
            return null;
        }
        String htmlUrl = map.get("html_url") instanceof String url ? url : null;
        boolean isPrivate = Boolean.TRUE.equals(map.get("private"));
        String owner = null;
        String ownerType = "User";
        if (map.get("owner") instanceof Map<?, ?> ownerMap) {
            if (ownerMap.get("login") instanceof String login) {
                owner = login;
            }
            if (ownerMap.get("type") instanceof String type && !type.isBlank()) {
                ownerType = type;
            }
        }
        if (owner == null) {
            int slash = name.indexOf('/');
            owner = slash > 0 ? name.substring(0, slash) : name;
        }
        return new ExistingRepo(name, htmlUrl, isPrivate, owner, ownerType);
    }

    private String nextLinkPath(String linkHeader) {
        if (linkHeader == null || linkHeader.isBlank()) {
            return null;
        }
        Matcher matcher = NEXT_LINK.matcher(linkHeader);
        if (!matcher.find()) {
            return null;
        }
        URI next = URI.create(matcher.group(1));
        String path = next.getRawPath();
        if (path == null) {
            return null;
        }
        return next.getRawQuery() == null ? path : path + "?" + next.getRawQuery();
    }

    public boolean userExists(String token, String username) {
        try {
            restClient.get()
                    .uri("/users/{username}", username)
                    .header("Authorization", "Bearer " + resolveToken(token))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (Exception e) {
            log.debug("Could not verify user existence for '{}': {}", username, e.getMessage());
            return true;
        }
    }

    private static String fullNameOf(String owner, String repoName) {
        if (owner == null || owner.isBlank()) {
            return repoName;
        }
        return owner + "/" + repoName;
    }

    private long backoff(int attempt) {
        return BASE_BACKOFF_MS * (long) Math.pow(2, attempt);
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private String truncate(String s) {
        if (s == null) return "";
        return s.length() > 300 ? s.substring(0, 300) + "..." : s;
    }
}
