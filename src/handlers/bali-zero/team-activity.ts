import { Request, Response } from 'express';

/**
 * TEAM RECENT ACTIVITY HANDLER
 *
 * Tracks and returns team members who have been active recently.
 * For now, this is a mock implementation that will be enhanced with real session tracking.
 *
 * Future enhancements:
 * - Integration with session/auth system
 * - Real login tracking from backend logs
 * - Activity metrics (messages sent, handlers called, etc.)
 */

interface TeamActivity {
  memberId: string;
  name: string;
  email: string;
  department: string;
  lastActive: string; // ISO timestamp
  activityType: 'login' | 'action' | 'message';
  activityCount: number;
}

// Mock data - in production this would come from session/auth logs
const MOCK_RECENT_ACTIVITY: TeamActivity[] = [
  {
    memberId: 'zero',
    name: 'Zero',
    email: 'zero@balizero.com',
    department: 'technology',
    lastActive: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    activityType: 'action',
    activityCount: 42
  },
  {
    memberId: 'amanda',
    name: 'Amanda',
    email: 'amanda@balizero.com',
    department: 'setup',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    activityType: 'login',
    activityCount: 8
  },
  {
    memberId: 'veronika',
    name: 'Veronika',
    email: 'veronika@balizero.com',
    department: 'tax',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
    activityType: 'message',
    activityCount: 15
  },
  {
    memberId: 'zainal',
    name: 'Zainal Abidin',
    email: 'zainal@balizero.com',
    department: 'management',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8h ago
    activityType: 'login',
    activityCount: 3
  }
];

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

    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Filter activities
    let activities = MOCK_RECENT_ACTIVITY.filter(activity => {
      const activityTime = new Date(activity.lastActive);
      return activityTime >= cutoffTime;
    });

    // Filter by department if specified
    if (department) {
      activities = activities.filter(a => a.department === department);
    }

    // Sort by most recent
    activities.sort((a, b) =>
      new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );

    // Limit results
    const limitedActivities = activities.slice(0, limit);

    // Calculate time ago for each activity
    const now = Date.now();
    const enrichedActivities = limitedActivities.map(activity => {
      const lastActiveTime = new Date(activity.lastActive).getTime();
      const minutesAgo = Math.floor((now - lastActiveTime) / (1000 * 60));

      let timeAgo;
      if (minutesAgo < 60) {
        timeAgo = `${minutesAgo} minutes ago`;
      } else if (minutesAgo < 60 * 24) {
        const hoursAgo = Math.floor(minutesAgo / 60);
        timeAgo = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
      } else {
        const daysAgo = Math.floor(minutesAgo / (60 * 24));
        timeAgo = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
      }

      return {
        ...activity,
        timeAgo
      };
    });

    return res.json({
      ok: true,
      data: {
        activities: enrichedActivities,
        count: enrichedActivities.length,
        total: activities.length,
        timeframe: {
          hours,
          from: cutoffTime.toISOString(),
          to: new Date().toISOString()
        },
        filters: {
          department: department || null
        },
        timestamp: new Date().toISOString(),
        note: 'This is currently mock data. Real session tracking will be integrated soon.'
      }
    });
  } catch (error: any) {
    console.error('team.recent_activity error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to retrieve recent activity'
    });
  }
}
