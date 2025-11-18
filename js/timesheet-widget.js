/**
 * Timesheet Widget - Clock In/Out Functionality
 * Integrates with ZANTARA backend timesheet system
 */

(function() {
  'use strict';

  const BACKEND_URL = 'https://nuzantara-rag.fly.dev';

  let clockButton = null;
  let clockStatus = null;
  let currentStatus = null;

  /**
   * Initialize widget when DOM ready
   */
  function init() {
    clockButton = document.getElementById('clockButton');
    clockStatus = document.getElementById('clockStatus');

    if (!clockButton) {
      console.warn('⚠️ Clock button not found');
      return;
    }

    // Add click handler
    clockButton.addEventListener('click', handleClockAction);

    // Check current clock status
    checkClockStatus();
  }

  /**
   * Check if user is currently clocked in
   */
  async function checkClockStatus() {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('⚠️ No auth token, hiding clock widget');
        hideWidget();
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/timesheet/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        currentStatus = data;
        updateUI(data.is_clocked_in);
      } else if (response.status === 404) {
        // Endpoint not implemented yet, hide widget
        console.warn('⚠️ Timesheet endpoint not available, hiding widget');
        hideWidget();
      } else {
        console.error('❌ Failed to check clock status:', response.status);
        updateUI(false);
      }
    } catch (error) {
      console.error('❌ Error checking clock status:', error);
      // Network error or endpoint doesn't exist - hide widget
      hideWidget();
    }
  }

  /**
   * Handle clock in/out button click
   */
  async function handleClockAction() {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Please login first');
        return;
      }

      // Disable button during request
      clockButton.disabled = true;

      const isClockedIn = clockButton.classList.contains('clocked-in');
      const endpoint = isClockedIn ? 'clock-out' : 'clock-in';

      const response = await fetch(`${BACKEND_URL}/api/timesheet/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${isClockedIn ? 'Clocked out' : 'Clocked in'}:`, data);

        // Update UI
        updateUI(!isClockedIn);

        // Show success message
        showNotification(
          isClockedIn ? 'Clocked out successfully' : 'Clocked in successfully',
          'success'
        );
      } else {
        const error = await response.json();
        console.error(`❌ Clock ${endpoint} failed:`, error);
        showNotification(error.message || 'Clock action failed', 'error');
      }
    } catch (error) {
      console.error('❌ Clock action error:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      clockButton.disabled = false;
    }
  }

  /**
   * Update UI based on clock status
   */
  function updateUI(isClockedIn) {
    if (!clockButton) return;

    if (isClockedIn) {
      clockButton.classList.add('clocked-in');
      clockButton.textContent = 'OUT';
      clockButton.title = 'Clock Out';
      if (clockStatus) {
        clockStatus.textContent = 'Working';
      }
    } else {
      clockButton.classList.remove('clocked-in');
      clockButton.textContent = 'IN';
      clockButton.title = 'Clock In';
      if (clockStatus) {
        clockStatus.textContent = '';
      }
    }
  }

  /**
   * Get auth token from localStorage
   */
  function getAuthToken() {
    try {
      const tokenData = localStorage.getItem('zantara-token');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        return parsed.token;
      }
    } catch (e) {
      console.error('❌ Failed to get auth token:', e);
    }
    return null;
  }

  /**
   * Hide widget if user not authenticated
   */
  function hideWidget() {
    const widget = document.querySelector('.timesheet-widget-minimal');
    if (widget) {
      widget.style.display = 'none';
    }
  }

  /**
   * Show notification message
   */
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `clock-notification clock-notification-${type}`;
    notification.textContent = message;

    // Style
    Object.assign(notification.style, {
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      borderRadius: '8px',
      background: type === 'success' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(239, 68, 68, 0.9)',
      color: '#fff',
      fontWeight: '600',
      fontSize: '14px',
      zIndex: '1000',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      animation: 'slideDown 0.3s ease'
    });

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
