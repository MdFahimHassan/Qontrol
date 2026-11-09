package com.quizapp.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Tiny public endpoint for hosting platforms: "is the app up?". Deliberately does not
 * touch the database, so a sleeping/suspended DB doesn't make the app look dead.
 */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}