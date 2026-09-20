package com.github.manager.controller;

import com.github.manager.client.GitHubClient;
import com.github.manager.dto.CreateReposRequest;
import com.github.manager.dto.CreateReposResponse;
import com.github.manager.dto.ExistingRepo;
import com.github.manager.service.RepoCreationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repos")
public class RepoController {

    private final RepoCreationService repoCreationService;
    private final GitHubClient gitHubClient;

    public RepoController(RepoCreationService repoCreationService, GitHubClient gitHubClient) {
        this.repoCreationService = repoCreationService;
        this.gitHubClient = gitHubClient;
    }

    @GetMapping
    public ResponseEntity<List<ExistingRepo>> listRepos(
            @RequestHeader(value = "X-GitHub-Token", required = false) String token,
            @RequestParam(value = "org", required = false) String org) {

        return ResponseEntity.ok(gitHubClient.listRepos(token, org));
    }

    @PostMapping("/generate")
    public ResponseEntity<CreateReposResponse> generateRepos(
            @RequestHeader(value = "X-GitHub-Token", required = false) String token,
            @Valid @RequestBody CreateReposRequest request) {

        CreateReposResponse response = repoCreationService.createRepos(token, request);
        return ResponseEntity.ok(response);
    }
}
