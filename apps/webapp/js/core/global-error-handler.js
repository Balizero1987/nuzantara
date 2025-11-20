/**
 * ZANTARA Global Error Handler
 * Centralized error boundary and error handling
 */

class GlobalErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.init();
    }

    init() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event.message, {
                type: 'runtime',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'promise',
                promise: event.promise
            });
        });

        console.log('🛡️ Global error handler initialized');
    }

    /**
     * Handle error
     */
    handleError(error, context = {}) {
        const errorInfo = {
            message: error?.message || String(error),
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Store error
        this.errors.push(errorInfo);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Log to console
        console.error('🚨 Global Error:', errorInfo);

        // Show user-friendly message
        if (window.toast) {
            const userMessage = this.getUserFriendlyMessage(error);
            window.toast.error(userMessage, 5000);
        }

        // Send to monitoring service (if configured)
        this.sendToMonitoring(errorInfo);

        return errorInfo;
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error) {
        const message = error?.message || String(error);

        // Network errors
        if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
            return 'Network error. Please check your connection.';
        }

        // Authentication errors
        if (message.includes('401') || message.includes('unauthorized')) {
            return 'Session expired. Please login again.';
        }

        // Permission errors
        if (message.includes('403') || message.includes('forbidden')) {
            return 'You don\'t have permission for this action.';
        }

        // Not found errors
        if (message.includes('404') || message.includes('not found')) {
            return 'Resource not found.';
        }

        // Server errors
        if (message.includes('500') || message.includes('server error')) {
            return 'Server error. Please try again later.';
        }

        // Generic error
        return 'An error occurred. Please try again.';
    }

    /**
     * Send error to monitoring service
     */
    sendToMonitoring(errorInfo) {
        // TODO: Integrate with Sentry, LogRocket, or similar
        // For now, just store in localStorage for debugging
        try {
            const stored = JSON.parse(localStorage.getItem('zantara-errors') || '[]');
            stored.push(errorInfo);
            // Keep only last 20 errors
            if (stored.length > 20) {
                stored.shift();
            }
            localStorage.setItem('zantara-errors', JSON.stringify(stored));
        } catch (e) {
            console.warn('Failed to store error:', e);
        }
    }

    /**
     * Get all errors
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Clear errors
     */
    clearErrors() {
        this.errors = [];
        try {
            localStorage.removeItem('zantara-errors');
        } catch (e) {
            console.warn('Failed to clear stored errors:', e);
        }
    }

    /**
     * Get error stats
     */
    getStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: this.errors.slice(-5)
        };

        this.errors.forEach(error => {
            const type = error.context?.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        return stats;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.GlobalErrorHandler = GlobalErrorHandler;
    window.errorHandler = new GlobalErrorHandler();
}

export default GlobalErrorHandler;
