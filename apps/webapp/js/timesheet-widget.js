/**
 * Team Timesheet Widget
 * Clock-in/out widget for navbar
 */

import { timesheetClient } from './timesheet-client.js';

class TimesheetWidget {
    constructor() {
        this.status = null;
        this.updateInterval = null;
        this.isOnline = false;
        this.todayHours = 0;
        this.clockInTime = null;
    }

    /**
     * Initialize the widget
     */
    async init() {
        this.createWidgetHTML();
        this.attachEventListeners();
        await this.updateStatus();

        // Update status every 60 seconds
        this.updateInterval = setInterval(() => this.updateStatus(), 60000);

        // Update timer every second if clocked in
        setInterval(() => {
            if (this.isOnline && this.clockInTime) {
                this.updateTimer();
            }
        }, 1000);
    }

    /**
     * Create widget HTML
     */
    createWidgetHTML() {
        const widget = document.createElement('div');
        widget.id = 'timesheet-widget';
        widget.className = 'timesheet-widget';
        widget.innerHTML = `
            <div class="timesheet-status">
                <div class="status-indicator" id="status-indicator"></div>
                <div class="status-text" id="status-text">Loading...</div>
            </div>
            <div class="timesheet-details" id="timesheet-details" style="display: none;">
                <div class="today-hours" id="today-hours">Today: 0.00h</div>
                <div class="current-session" id="current-session" style="display: none;">
                    Session: <span id="session-timer">00:00:00</span>
                </div>
            </div>
            <button class="timesheet-button" id="clock-button" disabled>
                <span id="button-text">Loading...</span>
            </button>
            ${timesheetClient.isAdmin() ? `
                <a href="team-dashboard.html" class="admin-link" title="Team Dashboard">
                    📊
                </a>
            ` : ''}
        `;

        // Insert widget into navbar (after user info or at the end)
        const navbar = document.querySelector('.header-content') ||
                      document.querySelector('header') ||
                      document.querySelector('nav') ||
                      document.body;

        navbar.appendChild(widget);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const button = document.getElementById('clock-button');
        if (button) {
            button.addEventListener('click', () => this.handleClockToggle());
        }

        // Show/hide details on hover
        const widget = document.getElementById('timesheet-widget');
        const details = document.getElementById('timesheet-details');

        if (widget && details) {
            widget.addEventListener('mouseenter', () => {
                details.style.display = 'block';
            });

            widget.addEventListener('mouseleave', () => {
                details.style.display = 'none';
            });
        }
    }

    /**
     * Update widget status
     */
    async updateStatus() {
        try {
            this.status = await timesheetClient.getMyStatus();
            this.isOnline = this.status.is_online;
            this.todayHours = this.status.today_hours || 0;

            if (this.isOnline && this.status.last_action) {
                this.clockInTime = new Date(this.status.last_action);
            } else {
                this.clockInTime = null;
            }

            this.render();
        } catch (error) {
            console.error('Failed to update timesheet status:', error);
            this.renderError();
        }
    }

    /**
     * Handle clock-in/out button click
     */
    async handleClockToggle() {
        const button = document.getElementById('clock-button');
        const buttonText = document.getElementById('button-text');

        if (!button || !buttonText) return;

        // Disable button during operation
        button.disabled = true;
        const originalText = buttonText.textContent;
        buttonText.textContent = this.isOnline ? 'Clocking out...' : 'Clocking in...';

        try {
            if (this.isOnline) {
                // Clock out
                const result = await timesheetClient.clockOut();
                this.showNotification(`Clocked out successfully! Worked ${result.hours_worked || 0}h`, 'success');
            } else {
                // Clock in
                await timesheetClient.clockIn();
                this.showNotification('Clocked in successfully!', 'success');
            }

            // Update status immediately
            await this.updateStatus();
        } catch (error) {
            console.error('Clock toggle failed:', error);
            this.showNotification(error.message || 'Operation failed', 'error');
            buttonText.textContent = originalText;
        } finally {
            button.disabled = false;
        }
    }

    /**
     * Update timer for current session
     */
    updateTimer() {
        if (!this.clockInTime) return;

        const now = new Date();
        const diff = now - this.clockInTime;

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        const timerElement = document.getElementById('session-timer');
        if (timerElement) {
            timerElement.textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    /**
     * Render widget state
     */
    render() {
        const indicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const button = document.getElementById('clock-button');
        const buttonText = document.getElementById('button-text');
        const todayHoursEl = document.getElementById('today-hours');
        const currentSession = document.getElementById('current-session');

        if (!indicator || !statusText || !button || !buttonText || !todayHoursEl) {
            return;
        }

        // Update status indicator
        if (this.isOnline) {
            indicator.className = 'status-indicator online';
            statusText.textContent = 'Online';
            buttonText.textContent = 'Clock Out';
            button.className = 'timesheet-button clock-out';
            if (currentSession) {
                currentSession.style.display = 'block';
                this.updateTimer();
            }
        } else {
            indicator.className = 'status-indicator offline';
            statusText.textContent = 'Offline';
            buttonText.textContent = 'Clock In';
            button.className = 'timesheet-button clock-in';
            if (currentSession) {
                currentSession.style.display = 'none';
            }
        }

        // Update today's hours
        todayHoursEl.textContent = `Today: ${this.todayHours.toFixed(2)}h`;

        // Enable button
        button.disabled = false;
    }

    /**
     * Render error state
     */
    renderError() {
        const statusText = document.getElementById('status-text');
        const button = document.getElementById('clock-button');
        const buttonText = document.getElementById('button-text');

        if (statusText) statusText.textContent = 'Error';
        if (button) button.disabled = false;
        if (buttonText) buttonText.textContent = 'Retry';
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `timesheet-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Destroy widget
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        const widget = document.getElementById('timesheet-widget');
        if (widget) {
            widget.remove();
        }
    }
}

// Export singleton instance
export const timesheetWidget = new TimesheetWidget();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize if user is logged in
        const token = localStorage.getItem('zantara-token');
        if (token) {
            timesheetWidget.init().catch(console.error);
        }
    });
} else {
    // DOM already loaded
    const token = localStorage.getItem('zantara-token');
    if (token) {
        timesheetWidget.init().catch(console.error);
    }
}
