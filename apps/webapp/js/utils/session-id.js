/**
 * Session ID Generator - Unified Utility
 *
 * Ensures consistent session ID format across all clients:
 * - ZantaraClient
 * - SSEClient
 * - ConversationClient
 *
 * Format: session_{timestamp}_{userId}_{random}
 * Example: session_1699876543210_user123_abc1def2g
 */

/**
 * Generate a unique session ID
 * @param {string|null} userId - Optional user ID for personalization
 * @returns {string} - Unique session ID
 */
export function generateSessionId(userId = null) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);

  if (userId) {
    return `session_${timestamp}_${userId}_${random}`;
  }

  return `session_${timestamp}_${random}`;
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

  // Match: session_{digits}_{alphanumeric}
  // OR: session_{digits}_{userId}_{alphanumeric}
  const pattern = /^session_\d+_[\w]+(_[\w]+)?$/;
  return pattern.test(sessionId);
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
  return parseInt(parts[1], 10);
}

/**
 * Extract user ID from session ID (if present)
 * @param {string} sessionId - Session ID
 * @returns {string|null} - User ID or null
 */
export function getSessionUserId(sessionId) {
  if (!isValidSessionId(sessionId)) {
    return null;
  }

  const parts = sessionId.split('_');
  // If 4 parts: session_{timestamp}_{userId}_{random}
  if (parts.length === 4) {
    return parts[2];
  }

  return null;
}

// Export for use in non-module scripts
if (typeof window !== 'undefined') {
  window.generateSessionId = generateSessionId;
  window.isValidSessionId = isValidSessionId;
  window.getSessionTimestamp = getSessionTimestamp;
  window.getSessionUserId = getSessionUserId;
}
