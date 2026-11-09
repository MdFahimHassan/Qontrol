package com.quizapp.security;

import java.util.ArrayDeque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.LongSupplier;

/**
 * Allows at most {@code maxRequests} per key (an IP address, a connection id...)
 * within any rolling {@code windowMs}. In-memory, so it is per backend instance —
 * fine for a single server; move to Redis if you ever run several.
 *
 * Framework-free on purpose: the clock is injectable so tests don't have to sleep.
 */
public class SlidingWindowRateLimiter {

    private static final long CLEANUP_EVERY = 500; // calls

    private final int maxRequests;
    private final long windowMs;
    private final LongSupplier clock;
    private final ConcurrentHashMap<String, ArrayDeque<Long>> hits = new ConcurrentHashMap<>();
    private final AtomicLong calls = new AtomicLong();

    public SlidingWindowRateLimiter(int maxRequests, long windowMs) {
        this(maxRequests, windowMs, System::currentTimeMillis);
    }

    public SlidingWindowRateLimiter(int maxRequests, long windowMs, LongSupplier clock) {
        this.maxRequests = Math.max(1, maxRequests);
        this.windowMs = windowMs;
        this.clock = clock;
    }

    /** Records a request for {@code key}. Returns false if the limit is already reached. */
    public boolean tryAcquire(String key) {
        long now = clock.getAsLong();
        if (calls.incrementAndGet() % CLEANUP_EVERY == 0) {
            cleanup(now);
        }
        ArrayDeque<Long> queue = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (queue) {
            prune(queue, now);
            if (queue.size() >= maxRequests) {
                return false;
            }
            queue.addLast(now);
            return true;
        }
    }

    /** Seconds until the oldest counted request leaves the window (for the Retry-After header). */
    public long retryAfterSeconds(String key) {
        ArrayDeque<Long> queue = hits.get(key);
        if (queue == null) return 0;
        long now = clock.getAsLong();
        synchronized (queue) {
            prune(queue, now);
            if (queue.size() < maxRequests || queue.isEmpty()) return 0;
            long waitMs = windowMs - (now - queue.peekFirst());
            return Math.max(1, (waitMs + 999) / 1000);
        }
    }

    /** Drops keys that have no requests left in the window, so memory stays bounded. */
    public void cleanup() {
        cleanup(clock.getAsLong());
    }

    public int trackedKeys() {
        return hits.size();
    }

    private void cleanup(long now) {
        hits.entrySet().removeIf(entry -> {
            ArrayDeque<Long> queue = entry.getValue();
            synchronized (queue) {
                prune(queue, now);
                return queue.isEmpty();
            }
        });
    }

    private void prune(ArrayDeque<Long> queue, long now) {
        while (!queue.isEmpty() && now - queue.peekFirst() >= windowMs) {
            queue.pollFirst();
        }
    }
}