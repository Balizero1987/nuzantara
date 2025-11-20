/**
 * ZANTARA Unified API Client
 * Centralized HTTP client with error handling, retry logic, and interceptors
 */

class UnifiedAPIClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev';
        this.timeout = config.timeout || 30000;
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;

        // Interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];

        // Add default auth interceptor
        this.addRequestInterceptor(this.authInterceptor.bind(this));
    }

    /**
     * Add request interceptor
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * Add response interceptor
     */
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    /**
     * Auth interceptor - adds Bearer token
     */
    authInterceptor(config) {
        const token = localStorage.getItem('zantara-token');
        if (token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    }

    /**
     * Execute request interceptors
     */
    async executeRequestInterceptors(config) {
        let modifiedConfig = { ...config };
        for (const interceptor of this.requestInterceptors) {
            modifiedConfig = await interceptor(modifiedConfig);
        }
        return modifiedConfig;
    }

    /**
     * Execute response interceptors
     */
    async executeResponseInterceptors(response) {
        let modifiedResponse = response;
        for (const interceptor of this.responseInterceptors) {
            modifiedResponse = await interceptor(modifiedResponse);
        }
        return modifiedResponse;
    }

    /**
     * Main request method with retry logic
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

        let config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Execute request interceptors
        config = await this.executeRequestInterceptors(config);

        // Retry logic
        let lastError;
        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Execute response interceptors
                const interceptedResponse = await this.executeResponseInterceptors(response);

                if (!interceptedResponse.ok) {
                    throw new APIError(
                        `HTTP ${interceptedResponse.status}: ${interceptedResponse.statusText}`,
                        interceptedResponse.status,
                        await interceptedResponse.text()
                    );
                }

                // Parse response
                const contentType = interceptedResponse.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await interceptedResponse.json();
                }
                return await interceptedResponse.text();

            } catch (error) {
                lastError = error;

                // Don't retry on client errors (4xx)
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // Wait before retry
                if (attempt < this.retryAttempts - 1) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt));
                }
            }
        }

        throw lastError;
    }

    /**
     * Convenience methods
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.response = response;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.UnifiedAPIClient = UnifiedAPIClient;
    window.APIError = APIError;

    // Create global instance
    window.apiClient = new UnifiedAPIClient();
}

export { UnifiedAPIClient, APIError };
