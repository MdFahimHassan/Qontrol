package com.quizapp.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JsonErrorsTest {

    @Test
    void escapesCharactersThatWouldBreakJson() {
        assertEquals("a\\\"b\\\\c\\nd", JsonErrors.escape("a\"b\\c\nd"));
        assertEquals("\\u0001", JsonErrors.escape("\u0001"));
        assertEquals("", JsonErrors.escape(null));
    }

    @Test
    void bodyHasTheSameFieldsAsErrorResponse() {
        String body = JsonErrors.body(429, "Too Many Requests", "Slow down", "/api/auth/login");
        assertTrue(body.contains("\"status\":429"));
        assertTrue(body.contains("\"error\":\"Too Many Requests\""));
        assertTrue(body.contains("\"message\":\"Slow down\""));
        assertTrue(body.contains("\"path\":\"/api/auth/login\""));
        assertTrue(body.contains("\"timestamp\":"));
    }

    @Test
    void aMaliciousPathCannotInjectJson() {
        String body = JsonErrors.body(404, "Not Found", "x", "/api/\",\"admin\":true,\"x\":\"");
        assertTrue(body.contains("\\\"admin\\\""));
        assertTrue(!body.contains("\"admin\":true"));
    }
}