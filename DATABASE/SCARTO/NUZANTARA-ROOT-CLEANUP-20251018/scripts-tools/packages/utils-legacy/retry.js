export async function withRetry(operation, options = {}) {
    const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2, maxDelayMs = 10000 } = options;
    let lastError = null;
    let currentDelay = delayMs;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                throw lastError;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, Math.min(currentDelay, maxDelayMs)));
            currentDelay *= backoffMultiplier;
        }
    }
    throw lastError;
}
export async function retryAsync(fn, maxRetries = 3, delay = 1000) {
    return withRetry(fn, { maxAttempts: maxRetries, delayMs: delay });
}
