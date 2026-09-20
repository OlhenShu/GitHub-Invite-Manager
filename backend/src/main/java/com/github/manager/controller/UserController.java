package com.github.manager.controller;

import com.github.manager.client.GitHubClient;
import com.github.manager.dto.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final GitHubClient gitHubClient;

    public UserController(GitHubClient gitHubClient) {
        this.gitHubClient = gitHubClient;
    }

    @GetMapping
    public ResponseEntity<AuthenticatedUser> me(
            @RequestHeader(value = "X-GitHub-Token", required = false) String token) {
        return ResponseEntity.ok(gitHubClient.getAuthenticatedUser(token));
    }
}
