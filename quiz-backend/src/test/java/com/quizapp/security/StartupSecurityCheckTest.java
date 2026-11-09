package com.quizapp.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StartupSecurityCheckTest {

    private static final String STRONG = "a-long-random-secret-that-is-definitely-over-32-chars";

    @Test
    void shortSecretIsRejectedEverywhere() {
        assertThrows(IllegalStateException.class, () -> StartupSecurityCheck.validate("too-short", false));
        assertThrows(IllegalStateException.class, () -> StartupSecurityCheck.validate(null, false));
    }

    @Test
    void developmentSecretIsAllowedLocallyButFlagged() {
        assertTrue(StartupSecurityCheck.validate(StartupSecurityCheck.DEV_SECRET, false));
    }

    @Test
    void developmentSecretIsRefusedInProduction() {
        assertThrows(IllegalStateException.class,
                () -> StartupSecurityCheck.validate(StartupSecurityCheck.DEV_SECRET, true));
    }

    @Test
    void realSecretPassesInProduction() {
        assertFalse(StartupSecurityCheck.validate(STRONG, true));
    }
}