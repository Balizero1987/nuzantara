/**
 * Team Timesheet API Client
 * Handles clock-in/out and timesheet data fetching
 */

import { API_CONFIG } from './api-config.js';

class TimesheetClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    /**
     * Get authentication headers
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

        const response = await fetch(`${this.baseURL}/api/team/clock-in`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                user_id: user.userId || user.user_id || user.id,
                email: user.email,
                metadata: {
                    user_agent: navigator.userAgent,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Clock-in failed');
        }

        return await response.json();
    }

    /**
     * Clock out from work
     */
    async clockOut() {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${this.baseURL}/api/team/clock-out`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                user_id: user.userId || user.user_id || user.id,
                email: user.email,
                metadata: {
                    user_agent: navigator.userAgent
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Clock-out failed');
        }

        return await response.json();
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
        const response = await fetch(
            `${this.baseURL}/api/team/my-status?user_id=${encodeURIComponent(userId)}`,
            {
                headers: this.getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch status');
        }

        return await response.json();
    }

    /**
     * Get team online status (ADMIN ONLY)
     */
    async getTeamStatus() {
        const response = await fetch(`${this.baseURL}/api/team/status`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Admin access required');
            }
            throw new Error('Failed to fetch team status');
        }

        return await response.json();
    }

    /**
     * Get daily hours (ADMIN ONLY)
     */
    async getDailyHours(date = null) {
        let url = `${this.baseURL}/api/team/hours`;
        if (date) {
            url += `?date=${date}`;
        }

        const response = await fetch(url, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Admin access required');
            }
            throw new Error('Failed to fetch daily hours');
        }

        return await response.json();
    }

    /**
     * Get weekly activity summary (ADMIN ONLY)
     */
    async getWeeklyActivity(weekStart = null) {
        let url = `${this.baseURL}/api/team/activity/weekly`;
        if (weekStart) {
            url += `?week_start=${weekStart}`;
        }

        const response = await fetch(url, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Admin access required');
            }
            throw new Error('Failed to fetch weekly activity');
        }

        return await response.json();
    }

    /**
     * Get monthly activity summary (ADMIN ONLY)
     */
    async getMonthlyActivity(monthStart = null) {
        let url = `${this.baseURL}/api/team/activity/monthly`;
        if (monthStart) {
            url += `?month_start=${monthStart}`;
        }

        const response = await fetch(url, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Admin access required');
            }
            throw new Error('Failed to fetch monthly activity');
        }

        return await response.json();
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
