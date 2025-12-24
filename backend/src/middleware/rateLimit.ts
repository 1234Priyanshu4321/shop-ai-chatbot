import rateLimit from 'express-rate-limit';

// Rate limiting: 10 requests per minute per IP
// Prevents abuse while allowing normal usage
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window per IP
  message: {
    error: 'Too many requests, please try again later.',
    reply: "I'm receiving too many messages right now. Please wait a moment and try again."
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

