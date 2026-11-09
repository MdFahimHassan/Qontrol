package com.quizapp.security;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Writes the same JSON error shape as GlobalExceptionHandler, but from places
 * that run BEFORE Spring MVC (security filters), where @ExceptionHandler can't help.
 */
public final class JsonErrors {

    private JsonErrors() {}

    public static void write(HttpServletResponse response, int status, String error, String message, String path)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(body(status, error, message, path));
    }

    static String body(int status, String error, String message, String path) {
        return "{\"timestamp\":\"" + LocalDateTime.now() + "\""
                + ",\"status\":" + status
                + ",\"error\":\"" + escape(error) + "\""
                + ",\"message\":\"" + escape(message) + "\""
                + ",\"path\":\"" + escape(path) + "\"}";
    }

    static String escape(String value) {
        if (value == null) return "";
        StringBuilder sb = new StringBuilder(value.length() + 8);
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }
}