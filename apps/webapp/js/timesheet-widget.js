/**
 * Team Timesheet Widget
 * Clock-in/out widget for navbar
 */

import { timesheetClient } from './timesheet-client.js';

class TimesheetWidget {
    constructor() {
        this.status = null;
        this.updateInterval = null;
        this.timerInterval = null; // Store timer interval for cleanup
        this.isOnline = false;
        this.todayHours = 0;
        this.clockInTime = null;
        this.isDestroyed = false; // Flag to prevent operations after destroy
    }

    /**
     * Initialize the widget
     */
    async init() {
        if (this.isDestroyed) return;
        
        this.createWidgetHTML();
        this.attachEventListeners();
        await this.updateStatus();

        // Update status every 60 seconds
        this.updateInterval = setInterval(() => {
            if (!this.isDestroyed) {
                this.updateStatus();
            }
        }, 60000);

        // Update timer every second if clocked in
        this.timerInterval = setInterval(() => {
            if (!this.isDestroyed && this.isOnline && this.clockInTime) {
                this.updateTimer();
            }
        }, 1000);
    }

    /**
     * Cleanup method to prevent memory leaks
     */
    destroy() {
        this.isDestroyed = true;
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Remove event listeners if needed
        const widget = document.getElementById('timesheet-widget');
        if (widget) {
            widget.remove();
        }
    }

    /**
     * Create widget HTML
     */
    createWidgetHTML() {
        const widget = document.createElement('div');
        widget.id = 'timesheet-widget';
        widget.className = 'timesheet-widget-minimal';
        widget.innerHTML = `
            <button class="clock-circle-button" id="clock-button" disabled>
                <span id="button-text">...</span>
            </button>
            <div class="timesheet-tooltip" id="timesheet-tooltip" style="display: none;">
                <div class="tooltip-status">
                    <div class="status-dot" id="status-dot"></div>
                    <span id="tooltip-text">Loading...</span>
                </div>
                <div class="tooltip-hours" id="today-hours">0.00h today</div>
                <div class="tooltip-session" id="current-session" style="display: none;">
                    <span id="session-timer">00:00:00</span>
                </div>
            </div>
            ${timesheetClient.isAdmin() ? `
            ` : ''}
        `;

        // Insert widget next to hamburger menu (left side of header)
        const header = document.querySelector('.chat-header');
        const hamburger = document.querySelector('.conversation-sidebar-toggle');

        if (header && hamburger) {
            // Insert after hamburger button
            hamburger.insertAdjacentElement('afterend', widget);
        } else if (header) {
            // Fallback: prepend to header
            header.prepend(widget);
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const button = document.getElementById('clock-button');
        if (button) {
            button.addEventListener('click', () => this.handleClockToggle());
        }

        // Show/hide tooltip on hover
        const widget = document.getElementById('timesheet-widget');
        const tooltip = document.getElementById('timesheet-tooltip');

        if (widget && tooltip) {
            widget.addEventListener('mouseenter', () => {
                tooltip.style.display = 'block';
            });

            widget.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
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
        const statusDot = document.getElementById('status-dot');
        const tooltipText = document.getElementById('tooltip-text');
        const button = document.getElementById('clock-button');
        const buttonText = document.getElementById('button-text');
        const todayHoursEl = document.getElementById('today-hours');
        const currentSession = document.getElementById('current-session');

        if (!statusDot || !tooltipText || !button || !buttonText || !todayHoursEl) {
            return;
        }

        // Update button and tooltip
        if (this.isOnline) {
            // User is clocked in - show OUT button
            statusDot.className = 'status-dot online';
            tooltipText.textContent = 'Online';
            buttonText.textContent = 'OUT';
            button.className = 'clock-circle-button active';
            if (currentSession) {
                currentSession.style.display = 'block';
                this.updateTimer();
            }
        } else {
            // User is clocked out - show IN button
            statusDot.className = 'status-dot offline';
            tooltipText.textContent = 'Offline';
            buttonText.textContent = 'IN';
            button.className = 'clock-circle-button';
            if (currentSession) {
                currentSession.style.display = 'none';
            }
        }

        // Update today's hours
        todayHoursEl.textContent = `${this.todayHours.toFixed(2)}h today`;

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
