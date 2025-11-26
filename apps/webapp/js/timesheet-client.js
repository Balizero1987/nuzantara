/**
 * Team Timesheet API Client
 * Handles clock-in/out and timesheet data fetching
 */

import { API_CONFIG } from './api-config.js';
import UnifiedAPIClient from './core/unified-api-client.js';

class TimesheetClient {
    constructor() {
        this.baseURL = API_CONFIG.backend.url;
        this.api = new UnifiedAPIClient({ baseURL: this.baseURL });
    }

    /**
     * Get authentication headers (deprecated - use this.api instead)
     */
    getAuthHeaders() {
        const tokenData = localStorage.getItem('zantara-token');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (tokenData) {
            try {
                const parsed = JSON.parse(tokenData);
                headers['Authorization'] = `Bearer ${parsed.token}`;
            } catch (e) {
                console.warn('Failed to parse token:', e);
            }
        }

        // Add user email for admin endpoints
        const userData = localStorage.getItem('zantara-user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.email) {
                    headers['X-User-Email'] = user.email;
                }
            } catch (e) {
                console.warn('Failed to parse user data:', e);
            }
        }

        return headers;
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        const userData = localStorage.getItem('zantara-user');
        if (!userData) return null;

        try {
            return JSON.parse(userData);
        } catch (e) {
            console.error('Failed to parse user data:', e);
            return null;
        }
    }

    /**
     * Clock in for work
     */
    async clockIn() {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await this.api.request('/api/team/clock-in', {
            method: 'POST',
                body: {
                user_id: user.userId || user.user_id || user.id,
                email: user.email,
                metadata: {
                    user_agent: navigator.userAgent,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
                }
        });
            return response;
        } catch (error) {
            throw new Error(error.message || 'Clock-in failed');
        }
    }

    /**
     * Clock out from work
     */
    async clockOut() {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await this.api.request('/api/team/clock-out', {
            method: 'POST',
                body: {
                user_id: user.userId || user.user_id || user.id,
                email: user.email,
                metadata: {
                    user_agent: navigator.userAgent
                }
                }
        });
            return response;
        } catch (error) {
            throw new Error(error.message || 'Clock-out failed');
        }
    }

    /**
     * Get my current status
     */
    async getMyStatus() {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const userId = user.userId || user.user_id || user.id;
        try {
            const response = await this.api.request(
                `/api/team/my-status?user_id=${encodeURIComponent(userId)}`,
                { method: 'GET' }
        );
            return response;
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch status');
        }
    }

    /**
     * Get team online status (ADMIN ONLY)
     */
    async getTeamStatus() {
        try {
            const response = await this.api.request('/api/team/status', {
                method: 'GET'
        });
            return response;
        } catch (error) {
            if (error.message && error.message.includes('403')) {
                throw new Error('Admin access required');
            }
            throw new Error(error.message || 'Failed to fetch team status');
        }
    }

    /**
     * Get daily hours (ADMIN ONLY)
     */
    async getDailyHours(date = null) {
        let endpoint = '/api/team/hours';
        if (date) {
            endpoint += `?date=${date}`;
        }

        try {
            const response = await this.api.request(endpoint, {
                method: 'GET'
        });
            return response;
        } catch (error) {
            if (error.message && error.message.includes('403')) {
                throw new Error('Admin access required');
            }
            throw new Error(error.message || 'Failed to fetch daily hours');
        }
    }

    /**
     * Get weekly activity summary (ADMIN ONLY)
     */
    async getWeeklyActivity(weekStart = null) {
        let endpoint = '/api/team/activity/weekly';
        if (weekStart) {
            endpoint += `?week_start=${weekStart}`;
        }

        try {
            const response = await this.api.request(endpoint, {
                method: 'GET'
        });
            return response;
        } catch (error) {
            if (error.message && error.message.includes('403')) {
                throw new Error('Admin access required');
            }
            throw new Error(error.message || 'Failed to fetch weekly activity');
        }
    }

    /**
     * Get monthly activity summary (ADMIN ONLY)
     */
    async getMonthlyActivity(monthStart = null) {
        let endpoint = '/api/team/activity/monthly';
        if (monthStart) {
            endpoint += `?month_start=${monthStart}`;
        }

        try {
            const response = await this.api.request(endpoint, {
                method: 'GET'
        });
            return response;
        } catch (error) {
            if (error.message && error.message.includes('403')) {
                throw new Error('Admin access required');
            }
            throw new Error(error.message || 'Failed to fetch monthly activity');
        }
    }

    /**
     * Check if current user is admin
     */
    isAdmin() {
        const user = this.getCurrentUser();
        if (!user || !user.email) return false;

        const adminEmails = [
            'zero@balizero.com',
            'admin@zantara.io',
            'admin@balizero.com'
        ];

        return adminEmails.includes(user.email.toLowerCase());
    }
}

export const timesheetClient = new TimesheetClient();
