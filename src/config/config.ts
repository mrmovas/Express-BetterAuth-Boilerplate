export const rateLimitConfig = {
    general: {
        windowsMs: 60 * 1000, // 1 minutes
        maxRequests: 100, // limit each IP to 100 requests per windowMs
    }
}