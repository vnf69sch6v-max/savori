/**
 * Client-side rate limiter for AI API calls
 * Prevents abuse and excessive costs
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
};

/**
 * Check if a request should be rate limited
 * @param key Unique identifier (e.g., `ai:${userId}`)
 * @param config Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, config: RateLimitConfig = DEFAULT_CONFIG): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        // First request or window expired - reset
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return true;
    }

    if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        return false;
    }

    // Increment counter
    entry.count++;
    return true;
}

/**
 * Get remaining requests for a key
 */
export function getRemainingRequests(key: string, config: RateLimitConfig = DEFAULT_CONFIG): number {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
}

/**
 * Reset rate limit for a key (e.g., on successful payment)
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

// Predefined configs for different AI features
export const AI_RATE_LIMITS = {
    scan: { maxRequests: 5, windowMs: 60 * 1000 },       // 5 scans per minute
    voice: { maxRequests: 10, windowMs: 60 * 1000 },     // 10 voice commands per minute
    insight: { maxRequests: 20, windowMs: 60 * 1000 },   // 20 insights per minute
    chat: { maxRequests: 30, windowMs: 60 * 1000 },      // 30 chat messages per minute
};

/**
 * Convenience wrapper for AI rate limiting
 */
export function canMakeAIRequest(userId: string, feature: keyof typeof AI_RATE_LIMITS): boolean {
    const key = `ai:${feature}:${userId}`;
    return checkRateLimit(key, AI_RATE_LIMITS[feature]);
}
