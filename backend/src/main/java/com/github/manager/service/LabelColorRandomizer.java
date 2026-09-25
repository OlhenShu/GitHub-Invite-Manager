package com.github.manager.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Distinct, readable hex colors (no leading #) for GitHub labels.
 */
public final class LabelColorRandomizer {

    private LabelColorRandomizer() {
    }

    public static List<String> distinctHex(int count, Set<String> avoid) {
        if (count <= 0) {
            return List.of();
        }
        Set<String> used = new LinkedHashSet<>();
        if (avoid != null) {
            for (String color : avoid) {
                if (color != null && !color.isBlank()) {
                    used.add(normalize(color));
                }
            }
        }

        double startHue = ThreadLocalRandom.current().nextDouble() * 360;
        List<String> colors = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            String hex = null;
            for (int attempt = 0; attempt < 24; attempt++) {
                double hue = (startHue + (360.0 * i / Math.max(count, 1)) + attempt * 13.7) % 360;
                double saturation = 0.58 + ThreadLocalRandom.current().nextDouble() * 0.22;
                double lightness = 0.38 + ThreadLocalRandom.current().nextDouble() * 0.18;
                hex = hslToHex(hue, saturation, lightness);
                if (!used.contains(hex)) {
                    break;
                }
            }
            used.add(hex);
            colors.add(hex);
        }
        return colors;
    }

    public static String normalize(String color) {
        return color.replace("#", "").trim().toLowerCase(Locale.ROOT);
    }

    static String hslToHex(double hue, double saturation, double lightness) {
        double c = (1 - Math.abs(2 * lightness - 1)) * saturation;
        double hp = hue / 60;
        double x = c * (1 - Math.abs(hp % 2 - 1));
        double r1 = 0;
        double g1 = 0;
        double b1 = 0;
        if (hp < 1) {
            r1 = c;
            g1 = x;
        } else if (hp < 2) {
            r1 = x;
            g1 = c;
        } else if (hp < 3) {
            g1 = c;
            b1 = x;
        } else if (hp < 4) {
            g1 = x;
            b1 = c;
        } else if (hp < 5) {
            r1 = x;
            b1 = c;
        } else {
            r1 = c;
            b1 = x;
        }
        double m = lightness - c / 2;
        return toHex(r1 + m) + toHex(g1 + m) + toHex(b1 + m);
    }

    private static String toHex(double channel) {
        int value = (int) Math.round(Math.min(1, Math.max(0, channel)) * 255);
        return String.format(Locale.ROOT, "%02x", value);
    }
}
