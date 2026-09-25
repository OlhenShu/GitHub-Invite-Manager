package com.github.manager.service;

import com.github.manager.client.GitHubClient;
import com.github.manager.dto.CopyIssuesRequest;
import com.github.manager.dto.CopyIssuesResponse;
import com.github.manager.dto.IssueCopyResult;
import com.github.manager.dto.IssuePreviewResponse;
import com.github.manager.dto.LabelColorResult;
import com.github.manager.dto.LabelCopyResult;
import com.github.manager.dto.RandomizeLabelsResponse;
import com.github.manager.dto.RepoLabel;
import com.github.manager.dto.RepoRef;
import com.github.manager.dto.SourceIssue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CopyIssuesService {

    private static final Logger log = LoggerFactory.getLogger(CopyIssuesService.class);
    private static final long REQUEST_DELAY_MS = 150;

    private final GitHubClient gitHubClient;

    public CopyIssuesService(GitHubClient gitHubClient) {
        this.gitHubClient = gitHubClient;
    }

    public IssuePreviewResponse preview(String token, String sourceRepo, boolean includeClosed) {
        RepoRef source = RepoRef.parse(sourceRepo);
        List<SourceIssue> issues = gitHubClient.listIssues(token, source, includeClosed);
        List<RepoLabel> labels = gitHubClient.listLabels(token, source);
        return new IssuePreviewResponse(source.fullName(), issues, labels);
    }

    public CopyIssuesResponse copy(String token, CopyIssuesRequest request) {
        RepoRef source = RepoRef.parse(request.sourceRepo());
        RepoRef target = RepoRef.parse(request.targetRepo());
        if (source.fullName().equalsIgnoreCase(target.fullName())) {
            throw new IllegalArgumentException("Source and target repositories must be different");
        }

        List<SourceIssue> issues = gitHubClient.listIssues(token, source, request.includeClosed());
        if (request.issueNumbers() != null && !request.issueNumbers().isEmpty()) {
            Set<Integer> wanted = new HashSet<>(request.issueNumbers());
            issues = issues.stream().filter(issue -> wanted.contains(issue.number())).toList();
        }

        Set<String> neededLabels = issues.stream()
                .flatMap(issue -> issue.labels().stream())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<LabelCopyResult> labelResults = new ArrayList<>();
        if (!neededLabels.isEmpty()) {
            List<RepoLabel> sourceLabels = gitHubClient.listLabels(token, source);
            for (RepoLabel label : sourceLabels) {
                if (!neededLabels.contains(label.name())) {
                    continue;
                }
                log.info("Ensuring label '{}' on {}", label.name(), target.fullName());
                labelResults.add(gitHubClient.ensureLabel(token, target, label));
                sleep(REQUEST_DELAY_MS);
            }
        }

        Set<String> existingTitles = gitHubClient.listIssues(token, target, true).stream()
                .map(SourceIssue::title)
                .collect(Collectors.toCollection(HashSet::new));

        List<IssueCopyResult> results = new ArrayList<>();
        for (SourceIssue issue : issues) {
            if (existingTitles.contains(issue.title())) {
                results.add(IssueCopyResult.skipped(
                        issue.number(), issue.title(),
                        "An issue with the same title already exists on the target",
                        issue.labels()));
                continue;
            }

            try {
                log.info("Copying issue #{} '{}' to {}", issue.number(), issue.title(), target.fullName());
                SourceIssue created = gitHubClient.createIssue(
                        token, target, issue.title(), buildBody(issue, source), issue.labels());
                if (request.preserveClosedState() && "closed".equalsIgnoreCase(issue.state())) {
                    gitHubClient.closeIssue(token, target, created.number());
                }
                existingTitles.add(issue.title());
                results.add(IssueCopyResult.copied(issue.number(), issue.title(), created.url(), issue.labels()));
            } catch (Exception e) {
                results.add(IssueCopyResult.failed(issue.number(), issue.title(), e.getMessage(), issue.labels()));
            }
            sleep(REQUEST_DELAY_MS);
        }

        return CopyIssuesResponse.of(results, labelResults);
    }

    public RandomizeLabelsResponse randomizeLabelColors(String token, String repository) {
        RepoRef repo = RepoRef.parse(repository);
        List<RepoLabel> labels = gitHubClient.listLabels(token, repo);
        if (labels.isEmpty()) {
            return RandomizeLabelsResponse.of(repo.fullName(), List.of());
        }

        Set<String> currentColors = labels.stream()
                .map(RepoLabel::color)
                .filter(color -> color != null && !color.isBlank())
                .map(LabelColorRandomizer::normalize)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<String> colors = LabelColorRandomizer.distinctHex(labels.size(), currentColors);

        List<LabelColorResult> results = new ArrayList<>(labels.size());
        for (int i = 0; i < labels.size(); i++) {
            RepoLabel label = labels.get(i);
            log.info("Recoloring label '{}' on {} -> {}", label.name(), repo.fullName(), colors.get(i));
            results.add(gitHubClient.updateLabelColor(token, repo, label.name(), label.color(), colors.get(i)));
            if (i < labels.size() - 1) {
                sleep(REQUEST_DELAY_MS);
            }
        }
        return RandomizeLabelsResponse.of(repo.fullName(), results);
    }

    private static String buildBody(SourceIssue issue, RepoRef source) {
        String original = issue.body() == null ? "" : issue.body();
        return original + "\n\n---\n_Copied from " + source.fullName() + "#" + issue.number() + "._";
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
