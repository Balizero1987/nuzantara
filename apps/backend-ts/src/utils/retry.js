export async function withRetry(fn, options = {}) {
    const { retries = 3, delay = 1000 } = options;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt === retries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
    throw new Error('Retry failed');
}
