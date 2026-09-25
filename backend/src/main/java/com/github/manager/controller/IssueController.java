package com.github.manager.controller;

import com.github.manager.dto.CopyIssuesRequest;
import com.github.manager.dto.CopyIssuesResponse;
import com.github.manager.dto.IssuePreviewResponse;
import com.github.manager.dto.RandomizeLabelsRequest;
import com.github.manager.dto.RandomizeLabelsResponse;
import com.github.manager.service.CopyIssuesService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final CopyIssuesService copyIssuesService;

    public IssueController(CopyIssuesService copyIssuesService) {
        this.copyIssuesService = copyIssuesService;
    }

    @GetMapping("/preview")
    public ResponseEntity<IssuePreviewResponse> preview(
            @RequestHeader(value = "X-GitHub-Token", required = false) String token,
            @RequestParam("source") String source,
            @RequestParam(value = "includeClosed", defaultValue = "false") boolean includeClosed) {
        return ResponseEntity.ok(copyIssuesService.preview(token, source, includeClosed));
    }

    @PostMapping("/copy")
    public ResponseEntity<CopyIssuesResponse> copy(
            @RequestHeader(value = "X-GitHub-Token", required = false) String token,
            @Valid @RequestBody CopyIssuesRequest request) {
        return ResponseEntity.ok(copyIssuesService.copy(token, request));
    }

    @PostMapping("/labels/randomize")
    public ResponseEntity<RandomizeLabelsResponse> randomizeLabels(
            @RequestHeader(value = "X-GitHub-Token", required = false) String token,
            @Valid @RequestBody RandomizeLabelsRequest request) {
        return ResponseEntity.ok(copyIssuesService.randomizeLabelColors(token, request.repository()));
    }
}
