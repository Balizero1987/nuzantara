export interface FetchOptions extends RequestInit {
    retries?: number;
    retryDelay?: number;
    timeout?: number;
}

export class FetchError extends Error {
    status?: number;
    statusText?: string;

    constructor(message: string, status?: number, statusText?: string) {
        super(message);
        this.name = 'FetchError';
        this.status = status;
        this.statusText = statusText;
    }
}

/**
 * Enhanced fetch with retry logic and timeout
 * @param url - The URL to fetch
 * @param options - Fetch options including retry configuration
 * @returns Promise<Response>
 */
export async function fetchWithRetry(
    url: string,
    options: FetchOptions = {}
): Promise<Response> {
    const {
        retries = 3,
        retryDelay = 1000,
        timeout = 10000,
        ...fetchOptions
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // If successful (2xx), return response
            if (response.ok) {
                return response;
            }

            // If client error (4xx), don't retry (except 408 Request Timeout or 429 Too Many Requests)
            if (response.status >= 400 && response.status < 500) {
                if (response.status !== 408 && response.status !== 429) {
                    throw new FetchError(
                        `HTTP error! status: ${response.status}`,
                        response.status,
                        response.statusText
                    );
                }
            }

            // If server error (5xx) or 408/429, throw to trigger retry
            throw new FetchError(
                `HTTP error! status: ${response.status}`,
                response.status,
                response.statusText
            );
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on the last attempt
            if (attempt === retries) {
                break;
            }

            // Don't retry if aborted by user (not timeout)
            if (lastError.name === 'AbortError' && !options.signal?.aborted) {
                // This was our internal timeout
                console.warn(`[fetchWithRetry] Request timed out (attempt ${attempt + 1}/${retries + 1})`);
            } else if (lastError instanceof FetchError && lastError.status && lastError.status < 500 && lastError.status !== 408 && lastError.status !== 429) {
                // Don't retry 4xx errors that are not 408/429
                throw lastError;
            } else {
                console.warn(
                    `[fetchWithRetry] Request failed (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}`
                );
            }

            // Exponential backoff with jitter
            const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 100;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Fetch failed after retries');
}
