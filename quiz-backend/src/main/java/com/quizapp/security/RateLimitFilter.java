package com.quizapp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rejects too-frequent calls to the login/register/status endpoints with
 * HTTP 429 + Retry-After. Created inside SecurityConfig (deliberately not a
 * @Component, so Spring Boot doesn't also register it a second time).
 *
 * Behind a reverse proxy (Render, Railway...) set FORWARD_HEADERS_STRATEGY=native
 * so getRemoteAddr() is the visitor's IP, not the proxy's.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimits;

    public RateLimitFilter(RateLimitService rateLimits) {
        this.rateLimits = rateLimits;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        SlidingWindowRateLimiter limiter = rateLimits.limiterFor(request.getMethod(), request.getRequestURI());
        if (limiter != null) {
            String ip = request.getRemoteAddr();
            if (!limiter.tryAcquire(ip)) {
                response.setHeader("Retry-After", String.valueOf(limiter.retryAfterSeconds(ip)));
                JsonErrors.write(response, 429, "Too Many Requests",
                        "Too many attempts. Please wait a minute and try again.", request.getRequestURI());
                return;
            }
        }
        chain.doFilter(request, response);
    }
}