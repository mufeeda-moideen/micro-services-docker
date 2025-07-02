import { RateLimitRequestHandler } from 'express-rate-limit';

// Extend Express Request with custom fields
declare global {
    namespace Express {
        interface Request {
            // Rate limit info (from express-rate-limit)
            rateLimit?: {
                limit: number;
                current: number;
                remaining: number;
                resetTime?: Date;
            };

            // Tracks verification attempts (e.g. for OTP)
            verificationAttempts?: {
                count: number;
                lastAttempt: Date;
            };
        }
    }
}
