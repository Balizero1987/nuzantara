/**
 * Session ID Generator
 * Generates unique session identifiers for conversation tracking
 */

/**
 * Generate a unique session ID
 * @param {string} userId - User ID to include in session
 * @returns {string} - Unique session identifier
 */
export function generateSessionId(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const userPart = userId ? `${userId}_` : '';

    return `session_${userPart}${timestamp}_${random}`;
}

/**
 * Validate session ID format
 * @param {string} sessionId - Session ID to validate
 * @returns {boolean} - True if valid format
 */
export function isValidSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
        return false;
    }

    // Format: session_{userId}_timestamp_random or session_timestamp_random
    return sessionId.startsWith('session_') && sessionId.split('_').length >= 3;
}

/**
 * Extract timestamp from session ID
 * @param {string} sessionId - Session ID
 * @returns {number|null} - Timestamp or null if invalid
 */
export function getSessionTimestamp(sessionId) {
    if (!isValidSessionId(sessionId)) {
        return null;
    }

    const parts = sessionId.split('_');
    // timestamp is second-to-last part
    const timestamp = parseInt(parts[parts.length - 2]);

    return isNaN(timestamp) ? null : timestamp;
}
