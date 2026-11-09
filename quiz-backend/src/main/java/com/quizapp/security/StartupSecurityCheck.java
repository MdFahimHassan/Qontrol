package com.quizapp.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Fails fast on an unsafe JWT secret instead of failing later in a confusing way.
 *  - under 32 bytes: HS256 refuses to sign, so every login would 500.
 *  - the well-known development secret in a "prod" deployment: anyone who has read
 *    this repo could forge a host token. Refuse to start.
 */
@Component
public class StartupSecurityCheck {

    static final String DEV_SECRET = "9a4f2c8d7e6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f";
    private static final Logger log = LoggerFactory.getLogger(StartupSecurityCheck.class);

    private final Environment environment;
    private final String secret;

    public StartupSecurityCheck(Environment environment, @Value("${jwt.secret:" + DEV_SECRET + "}") String secret) {
        this.environment = environment;
        this.secret = secret;
    }

    @PostConstruct
    void check() {
        boolean prod = environment.acceptsProfiles(Profiles.of("prod", "production"));
        if (validate(secret, prod)) {
            log.warn("Using the built-in DEVELOPMENT jwt.secret. Set JWT_SECRET before deploying anywhere public.");
        }
    }

    /** @return true if the development secret is in use (caller should warn). Throws if unsafe. */
    static boolean validate(String secret, boolean prod) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 characters long. Set JWT_SECRET.");
        }
        boolean devSecret = DEV_SECRET.equals(secret);
        if (devSecret && prod) {
            throw new IllegalStateException(
                    "Refusing to start in the prod profile with the built-in development jwt.secret. Set JWT_SECRET.");
        }
        return devSecret;
    }
}