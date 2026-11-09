package com.quizapp.security;

import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SlidingWindowRateLimiterTest {

    private final AtomicLong now = new AtomicLong(1_000_000);

    private SlidingWindowRateLimiter limiter(int max) {
        return new SlidingWindowRateLimiter(max, 60_000, now::get);
    }

    @Test
    void allowsUpToTheLimitThenBlocks() {
        SlidingWindowRateLimiter limiter = limiter(3);
        assertTrue(limiter.tryAcquire("1.2.3.4"));
        assertTrue(limiter.tryAcquire("1.2.3.4"));
        assertTrue(limiter.tryAcquire("1.2.3.4"));
        assertFalse(limiter.tryAcquire("1.2.3.4"));
    }

    @Test
    void keysAreIndependent() {
        SlidingWindowRateLimiter limiter = limiter(1);
        assertTrue(limiter.tryAcquire("a"));
        assertFalse(limiter.tryAcquire("a"));
        assertTrue(limiter.tryAcquire("b"));
    }

    @Test
    void windowSlidesSoOldRequestsStopCounting() {
        SlidingWindowRateLimiter limiter = limiter(2);
        assertTrue(limiter.tryAcquire("a"));
        now.addAndGet(30_000);
        assertTrue(limiter.tryAcquire("a"));
        assertFalse(limiter.tryAcquire("a"));

        now.addAndGet(31_000); // the first request is now 61s old, the second only 31s
        assertTrue(limiter.tryAcquire("a"));
        assertFalse(limiter.tryAcquire("a"));
    }

    @Test
    void retryAfterTellsWhenTheOldestRequestExpires() {
        SlidingWindowRateLimiter limiter = limiter(1);
        assertEquals(0, limiter.retryAfterSeconds("a"));
        limiter.tryAcquire("a");
        now.addAndGet(20_000);
        assertEquals(40, limiter.retryAfterSeconds("a"));
    }

    @Test
    void cleanupForgetsIdleKeys() {
        SlidingWindowRateLimiter limiter = limiter(5);
        limiter.tryAcquire("a");
        limiter.tryAcquire("b");
        assertEquals(2, limiter.trackedKeys());
        now.addAndGet(61_000);
        limiter.cleanup();
        assertEquals(0, limiter.trackedKeys());
    }
}