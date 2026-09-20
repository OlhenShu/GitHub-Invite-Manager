package com.github.manager.service;

import com.github.manager.client.GitHubClient;
import com.github.manager.dto.CreateReposRequest;
import com.github.manager.dto.CreateReposResponse;
import com.github.manager.dto.NamingMode;
import com.github.manager.dto.RepoResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RepoCreationService {

    private static final Logger log = LoggerFactory.getLogger(RepoCreationService.class);
    private static final long REQUEST_DELAY_MS = 200;

    private final GitHubClient gitHubClient;
    private final RepoNameGenerator nameGenerator;

    public RepoCreationService(GitHubClient gitHubClient, RepoNameGenerator nameGenerator) {
        this.gitHubClient = gitHubClient;
        this.nameGenerator = nameGenerator;
    }

    public CreateReposResponse createRepos(String token, CreateReposRequest request) {
        List<String> repoNames = resolveRepoNames(request);
        String targetOrg = request.targetOrg() == null ? "" : request.targetOrg().trim();
        if (targetOrg.isEmpty() && "internal".equalsIgnoreCase(request.visibility())) {
            throw new IllegalArgumentException("Internal visibility requires a target organization");
        }

        boolean isPrivate = !"public".equalsIgnoreCase(request.visibility());
        String fallbackOwner = targetOrg;
        if (fallbackOwner.isEmpty()) {
            fallbackOwner = gitHubClient.getAuthenticatedUser(token).login();
        }

        List<RepoResult> results = new ArrayList<>(repoNames.size());
        for (int i = 0; i < repoNames.size(); i++) {
            String name = repoNames.get(i);
            log.info("Creating repo {}/{} — '{}'", i + 1, repoNames.size(), name);

            RepoResult result = gitHubClient.createRepoFromTemplate(
                    token,
                    request.templateOwner(), request.templateRepo(),
                    targetOrg.isEmpty() ? null : targetOrg, name,
                    request.description(), request.includeAllBranches(), isPrivate,
                    fallbackOwner
            );
            results.add(result);

            // Small delay to be respectful of rate limits (except on last request)
            if (i < repoNames.size() - 1) {
                sleep(REQUEST_DELAY_MS);
            }
        }

        return CreateReposResponse.of(results);
    }

    private List<String> resolveRepoNames(CreateReposRequest request) {
        if (request.namingMode() == NamingMode.PATTERN) {
            if (request.baseName() == null || request.baseName().isBlank()) {
                throw new IllegalArgumentException("baseName is required for PATTERN naming mode");
            }
            if (request.count() == null || request.count() < 1) {
                throw new IllegalArgumentException("count is required and must be >= 1 for PATTERN naming mode");
            }
            return nameGenerator.generateFromPattern(
                    request.baseName(), request.count(), request.startIndex(), request.padding()
            );
        } else {
            if (request.repoNames() == null || request.repoNames().isEmpty()) {
                throw new IllegalArgumentException("repoNames is required for LIST naming mode");
            }
            return nameGenerator.fromList(request.repoNames());
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
