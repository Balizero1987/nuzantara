/**
 * SESSION TRACKING SERVICE
 *
 * Tracks team member activity for team.recent_activity handler
 * Integrates with auth middleware and monitoring
 */
import logger from './logger.js';
// In-memory session store (TODO: Move to Firestore for persistence)
const sessionStore = new Map();
// Team member mappings (email -> profile)
const TEAM_MEMBERS = new Map([
    ['zero@balizero.com', { name: 'Zero', department: 'technology' }],
    ['amanda@balizero.com', { name: 'Amanda', department: 'setup' }],
    ['veronika@balizero.com', { name: 'Veronika', department: 'tax' }],
    ['zainal@balizero.com', { name: 'Zainal Abidin', department: 'management' }],
    ['paolo@balizero.com', { name: 'Paolo', department: 'technology' }],
    ['luca@balizero.com', { name: 'Luca', department: 'technology' }],
    ['maria@balizero.com', { name: 'Maria', department: 'legal' }],
    ['francesca@balizero.com', { name: 'Francesca', department: 'accounting' }],
]);
/**
 * Extract user identity from request
 * Looks for: x-user-id header, x-api-key mapping, identity from body params
 */
function extractUserIdentity(req) {
    // Check x-user-id header (set by webapp)
    const userId = req.header('x-user-id');
    if (userId && userId.includes('@')) {
        return {
            email: userId,
            memberId: userId?.split('@')[0]?.toLowerCase() || 'unknown'
        };
    }
    // Check x-api-key for internal team members
    const apiKey = req.header('x-api-key');
    if (apiKey) {
        // Map API keys to team members (simplified)
        // In production: query Firestore users collection
        const keyToEmail = {
            'zantara-internal-dev-key-2025': 'zero@balizero.com',
            // Add other team API keys here
        };
        const email = keyToEmail[apiKey];
        if (email) {
            return {
                email,
                memberId: email?.split('@')[0]?.toLowerCase() || 'unknown'
            };
        }
    }
    // Check body params for email/userId
    if (req.body?.userId?.includes('@')) {
        return {
            email: req.body.userId,
            memberId: req.body.userId.split('@')[0].toLowerCase()
        };
    }
    return null;
}
/**
 * Track activity for a request
 * Called by middleware on every authenticated request
 */
export function trackActivity(req, activityType = 'action') {
    const identity = extractUserIdentity(req);
    if (!identity)
        return; // Not a team member request
    const teamProfile = TEAM_MEMBERS.get(identity.email);
    if (!teamProfile)
        return; // Not in team directory
    const existingSession = sessionStore.get(identity.memberId);
    const activity = {
        memberId: identity.memberId,
        name: teamProfile.name,
        email: identity.email,
        department: teamProfile.department,
        lastActive: new Date(),
        activityType,
        activityCount: (existingSession?.activityCount || 0) + 1,
        lastHandler: (req.body?.key) || undefined,
        lastPath: req.path
    };
    sessionStore.set(identity.memberId, activity);
    logger.info(`📊 Activity tracked: ${identity.email} (${activityType}) - ${activity.activityCount} actions`);
}
export function getRecentActivities(params = {}) {
    const { hours = 24, limit = 10, department } = params;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    let activities = Array.from(sessionStore.values())
        .filter(activity => activity.lastActive >= cutoffTime);
    if (department) {
        activities = activities.filter(a => a.department === department);
    }
    // Sort by most recent first
    activities.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
    return activities.slice(0, limit);
}
/**
 * Get activity statistics
 */
export function getActivityStats() {
    const now = Date.now();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last1h = new Date(now - 60 * 60 * 1000);
    const allActivities = Array.from(sessionStore.values());
    return {
        totalMembers: TEAM_MEMBERS.size,
        activeLast24h: allActivities.filter(a => a.lastActive >= last24h).length,
        activeLast1h: allActivities.filter(a => a.lastActive >= last1h).length,
        totalActions: allActivities.reduce((sum, a) => sum + a.activityCount, 0),
        byDepartment: groupByDepartment(allActivities)
    };
}
function groupByDepartment(activities) {
    const departments = new Map();
    for (const activity of activities) {
        departments.set(activity.department, (departments.get(activity.department) || 0) + 1);
    }
    return Object.fromEntries(departments);
}
/**
 * Clear old sessions (call periodically)
 */
export function cleanupOldSessions(maxAgeHours = 168) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let cleaned = 0;
    for (const [memberId, activity] of Array.from(sessionStore.entries())) {
        if (activity.lastActive < cutoffTime) {
            sessionStore.delete(memberId);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        logger.info(`🧹 Cleaned ${cleaned} old sessions (older than ${maxAgeHours}h)`);
    }
    return cleaned;
}
// Auto-cleanup every 6 hours
setInterval(() => cleanupOldSessions(), 6 * 60 * 60 * 1000);
