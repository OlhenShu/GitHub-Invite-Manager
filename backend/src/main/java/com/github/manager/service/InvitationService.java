package com.github.manager.service;

import com.github.manager.client.GitHubClient;
import com.github.manager.dto.InviteAssignment;
import com.github.manager.dto.InviteMode;
import com.github.manager.dto.InviteRequest;
import com.github.manager.dto.InviteResponse;
import com.github.manager.dto.InviteResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class InvitationService {

    private static final Logger log = LoggerFactory.getLogger(InvitationService.class);
    private static final long REQUEST_DELAY_MS = 150;

    private final GitHubClient gitHubClient;
    private final UsernameParser usernameParser;

    public InvitationService(GitHubClient gitHubClient, UsernameParser usernameParser) {
        this.gitHubClient = gitHubClient;
        this.usernameParser = usernameParser;
    }

    public InviteResponse sendInvites(String token, InviteRequest request) {
        List<String> usernames = usernameParser.parse(request.rawUsernames());
        List<String> repositories = request.repositories().stream()
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();
        String permission = request.permission();

        if (usernames.isEmpty()) {
            throw new IllegalArgumentException("No valid usernames found in the provided text");
        }

        if (request.mode() == InviteMode.TEAM) {
            List<InviteAssignment> assignments = request.assignments();
            if (assignments != null && !assignments.isEmpty()) {
                return sendAssignedInvites(token, assignments, permission);
            }
            return sendTeamInvites(token, usernames, repositories, permission);
        }
        return sendIndividualInvites(token, usernames, repositories, permission);
    }

    private InviteResponse sendAssignedInvites(String token, List<InviteAssignment> assignments,
                                               String permission) {
        List<InviteResult> results = new ArrayList<>();
        int total = assignments.size();
        int idx = 0;

        for (InviteAssignment assignment : assignments) {
            String repository = assignment.repository() == null ? "" : assignment.repository().trim();
            String username = assignment.username() == null ? "" : assignment.username().trim();

            if (username.isBlank()) {
                results.add(InviteResult.failed(repository, "–", "Username is required"));
                continue;
            }

            String[] parts = repository.split("/", 2);
            if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
                log.warn("Skipping invalid repository format: '{}'", repository);
                results.add(InviteResult.failed(repository, username,
                        "Invalid repository format (expected owner/repo)"));
                continue;
            }

            log.info("Inviting {}/{} – {} to {}", ++idx, total, username, repository);
            results.add(gitHubClient.inviteCollaborator(
                    token, parts[0], parts[1], username, permission));

            if (idx < total) {
                sleep(REQUEST_DELAY_MS);
            }
        }

        return InviteResponse.of(results);
    }

    private InviteResponse sendIndividualInvites(String token, List<String> usernames,
                                                  List<String> repositories, String permission) {
        // 1-to-1 pairing: repositories[i] → usernames[i]
        int pairCount = Math.min(repositories.size(), usernames.size());
        List<InviteResult> results = new ArrayList<>();

        for (int i = 0; i < pairCount; i++) {
            String repository = repositories.get(i);
            String username = usernames.get(i);

            String[] parts = repository.split("/", 2);
            if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
                log.warn("Skipping invalid repository format: '{}'", repository);
                results.add(InviteResult.failed(repository, username,
                        "Invalid repository format (expected owner/repo)"));
                continue;
            }

            log.info("Inviting {}/{} — {} to {}", i + 1, pairCount, username, repository);
            InviteResult result = gitHubClient.inviteCollaborator(
                    token, parts[0], parts[1], username, permission);
            results.add(result);

            if (i < pairCount - 1) {
                sleep(REQUEST_DELAY_MS);
            }
        }

        for (int i = pairCount; i < repositories.size(); i++) {
            results.add(InviteResult.failed(repositories.get(i), "—",
                    "No username at position " + (i + 1) + " — list is shorter than repo list"));
        }

        for (int i = pairCount; i < usernames.size(); i++) {
            results.add(InviteResult.failed("—", usernames.get(i),
                    "No repository at position " + (i + 1) + " — list is shorter than username list"));
        }

        return InviteResponse.of(results);
    }

    private InviteResponse sendTeamInvites(String token, List<String> usernames,
                                            List<String> repositories, String permission) {
        // N×M: every user is invited to every repository
        int total = repositories.size() * usernames.size();
        List<InviteResult> results = new ArrayList<>();
        int idx = 0;

        for (String repository : repositories) {
            String[] parts = repository.split("/", 2);
            if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
                log.warn("Skipping invalid repository format: '{}'", repository);
                for (String username : usernames) {
                    results.add(InviteResult.failed(repository, username,
                            "Invalid repository format (expected owner/repo)"));
                }
                continue;
            }

            for (String username : usernames) {
                log.info("Inviting {}/{} — {} to {}", ++idx, total, username, repository);
                InviteResult result = gitHubClient.inviteCollaborator(
                        token, parts[0], parts[1], username, permission);
                results.add(result);

                if (idx < total) {
                    sleep(REQUEST_DELAY_MS);
                }
            }
        }

        return InviteResponse.of(results);
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
