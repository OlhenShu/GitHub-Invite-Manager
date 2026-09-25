package com.github.manager.service;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class LabelColorRandomizerTest {

    @Test
    void generatesUniqueReadableHex() {
        List<String> colors = LabelColorRandomizer.distinctHex(12, Set.of("ededed", "ffffff"));
        assertThat(colors).hasSize(12);
        assertThat(new HashSet<>(colors)).hasSize(12);
        assertThat(colors).allMatch(color -> color.matches("[0-9a-f]{6}"));
        assertThat(colors).doesNotContain("ededed", "ffffff");
    }

    @Test
    void returnsEmptyForZero() {
        assertThat(LabelColorRandomizer.distinctHex(0, Set.of())).isEmpty();
    }
}
