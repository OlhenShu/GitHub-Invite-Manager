package com.github.manager.client;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GitHubClientPaginationTest {

    @Test
    void keepsCursorEncodingFromLinkHeader() {
        String link = "<https://api.github.com/repositories/1/issues?after=Y3Vyc29yOnYyOpLPAAABljPgoxDOsmA1uQ%3D%3D>; rel=\"next\", "
                + "<https://api.github.com/repositories/1/issues?before=abc>; rel=\"prev\"";
        assertThat(GitHubClient.nextLinkUrl(link))
                .isEqualTo("https://api.github.com/repositories/1/issues?after=Y3Vyc29yOnYyOpLPAAABljPgoxDOsmA1uQ%3D%3D");
    }

    @Test
    void returnsNullWhenThereIsNoNext() {
        assertThat(GitHubClient.nextLinkUrl("<https://api.github.com/repos/a/b/issues>; rel=\"prev\"")).isNull();
        assertThat(GitHubClient.nextLinkUrl(null)).isNull();
    }
}
