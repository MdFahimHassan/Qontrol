package com.quizapp.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * The app's rate limits in one place. All numbers are per minute and can be
 * changed with environment variables (see application.properties).
 *
 *   auth    - POST /api/auth/login and /register, per IP    (stops password guessing)
 *   status  - GET /api/games/{PIN}/status, per IP           (stops PIN enumeration)
 *   join    - STOMP "join" messages, per IP and per socket  (stops join spam)
 *
 * The IP limits are generous on purpose: a whole classroom or event shares one
 * public IP and joins within the same minute.
 */
@Component
public class RateLimitService {

    private static final long MINUTE = TimeUnit.MINUTES.toMillis(1);

    private final SlidingWindowRateLimiter auth;
    private final SlidingWindowRateLimiter status;
    private final SlidingWindowRateLimiter joinPerIp;
    private final SlidingWindowRateLimiter joinPerConnection;

    public RateLimitService(@Value("${rate-limit.auth-per-minute:20}") int authPerMinute,
                            @Value("${rate-limit.status-per-minute:120}") int statusPerMinute,
                            @Value("${rate-limit.join-per-minute:200}") int joinPerMinute) {
        this.auth = new SlidingWindowRateLimiter(authPerMinute, MINUTE);
        this.status = new SlidingWindowRateLimiter(statusPerMinute, MINUTE);
        this.joinPerIp = new SlidingWindowRateLimiter(joinPerMinute, MINUTE);
        this.joinPerConnection = new SlidingWindowRateLimiter(15, MINUTE);
    }

    /** The limiter that applies to this HTTP request, or null if the request is not limited. */
    public SlidingWindowRateLimiter limiterFor(String method, String path) {
        if ("POST".equals(method) && ("/api/auth/login".equals(path) || "/api/auth/register".equals(path))) {
            return auth;
        }
        if ("GET".equals(method) && path != null && path.matches("^/api/games/[^/]+/status$")) {
            return status;
        }
        return null;
    }

    /** One call per STOMP join message. */
    public boolean allowJoin(String clientIp, String connectionId) {
        return joinPerConnection.tryAcquire(connectionId) && joinPerIp.tryAcquire(clientIp);
    }
}