import rateLimit from 'express-rate-limit';

// Create a rate limiter middleware
export const rateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // Limit each IP to 30 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 5 minutes' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Create a stricter rate limiter for authentication routes
export const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { message: 'Too many login attempts, please try again after 5 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests, including successful ones
    keyGenerator: (req) => {
        // Use IP + email as the key to track failed attempts per email
        return req.ip + (req.body.email || '');
    }
});
