package com.github.manager.dto;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RepoRefTest {

    @Test
    void parsesOwnerAndRepo() {
        RepoRef ref = RepoRef.parse("mentor/lab-01");
        assertThat(ref.owner()).isEqualTo("mentor");
        assertThat(ref.repo()).isEqualTo("lab-01");
        assertThat(ref.fullName()).isEqualTo("mentor/lab-01");
    }

    @Test
    void rejectsMissingSlash() {
        assertThatThrownBy(() -> RepoRef.parse("lab-01"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("owner/repo");
    }

    @Test
    void rejectsBlank() {
        assertThatThrownBy(() -> RepoRef.parse("  "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
