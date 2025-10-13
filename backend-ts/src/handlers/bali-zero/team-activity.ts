import logger from '../../services/logger.js';
import { Request, Response } from 'express';
import { getRecentActivities, getActivityStats } from '../../services/session-tracker.js';

/**
 * TEAM RECENT ACTIVITY HANDLER
 *
 * Tracks and returns team members who have been active recently.
 * Uses session-tracker service for real-time activity monitoring.
 *
 * Features:
 * - Real session tracking from request middleware
 * - Activity counts and last action tracking
 * - Department filtering
 * - Time-based filtering (last N hours)
 */

/**
 * Get recent team activity
 *
 * Params:
 * - hours: Number of hours to look back (default: 24)
 * - limit: Max number of results (default: 10)
 * - department: Filter by department (optional)
 */
export async function teamRecentActivity(req: Request, res: Response) {
  try {
    const { hours = 24, limit = 10, department } = req.body.params || {};

    // Get activities from session tracker
    const activities = getRecentActivities({ hours, limit, department });

    // Calculate time ago for each activity
    const now = Date.now();
    const enrichedActivities = activities.map(activity => {
      const lastActiveTime = activity.lastActive.getTime();
      const minutesAgo = Math.floor((now - lastActiveTime) / (1000 * 60));

      let timeAgo;
      if (minutesAgo < 1) {
        timeAgo = 'just now';
      } else if (minutesAgo < 60) {
        timeAgo = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
      } else if (minutesAgo < 60 * 24) {
        const hoursAgo = Math.floor(minutesAgo / 60);
        timeAgo = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
      } else {
        const daysAgo = Math.floor(minutesAgo / (60 * 24));
        timeAgo = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
      }

      return {
        memberId: activity.memberId,
        name: activity.name,
        email: activity.email,
        department: activity.department,
        lastActive: activity.lastActive.toISOString(),
        activityType: activity.activityType,
        activityCount: activity.activityCount,
        lastHandler: activity.lastHandler,
        lastPath: activity.lastPath,
        timeAgo
      };
    });

    // Get activity stats
    const stats = getActivityStats();

    return res.json({
      ok: true,
      data: {
        activities: enrichedActivities,
        count: enrichedActivities.length,
        timeframe: {
          hours,
          from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        },
        filters: {
          department: department || null,
          limit
        },
        stats,
        timestamp: new Date().toISOString(),
        tracking: 'real-time' // Indicate this is using real session tracking
      }
    });
  } catch (error: any) {
    logger.error('team.recent_activity error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to retrieve recent activity'
    });
  }
}
