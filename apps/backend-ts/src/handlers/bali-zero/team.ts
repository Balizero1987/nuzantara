import logger from '../../services/logger.js';
import { Request, Response } from 'express';
import { RedisClientWrapper } from '../../services/redis-client.js';

// Redis cache for team members (1 hour TTL)
const redisClient = new RedisClientWrapper();
const TEAM_CACHE_KEY = 'balizero:team:members';
const TEAM_CACHE_TTL = 3600; // 1 hour

// TABULA RASA: Team data MUST be retrieved from database
// This legacy structure is kept only as a fallback stub - all team data comes from database
// TODO: Remove this stub once database integration is complete
const BALI_ZERO_TEAM = {
  members: [] as any[], // Team members retrieved from database - no hardcoded data
  // Departments and stats retrieved from database - no hardcoded data
  departments: {} as Record<string, { name: string; color: string; icon: string }>,
  stats: {
    total: 0,
    byDepartment: {} as Record<string, number>,
    byLanguage: {} as Record<string, number>,
  },
};

/**
 * Get complete team list
 */
export async function teamList(req: Request, res: Response) {
  try {
    const { department, role, search } = req.body.params || {};

    // Try Redis cache first (only for unfiltered requests)
    if (!department && !role && !search) {
      const cached = await redisClient.get(TEAM_CACHE_KEY);
      if (cached) {
        logger.info('✅ Team list served from Redis cache');
        return res.json(JSON.parse(cached));
      }
    }

    // TABULA RASA: Team members MUST be retrieved from database
    // TODO: Replace with database query
    logger.warn('⚠️ Team list using fallback stub - team data should come from database');
    const members: any[] = []; // Retrieved from database

    // Filter by department
    if (department) {
      members = members.filter((m) => m.department === department);
    }

    // Filter by role
    if (role) {
      members = members.filter((m) => m.role.toLowerCase().includes(role.toLowerCase()));
    }

    // Search by name or email
    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) || m.email.toLowerCase().includes(searchLower)
      );
    }

    // TABULA RASA: All team data MUST come from database
    const response = {
      ok: true,
      data: {
        members, // Retrieved from database
        departments: {}, // Retrieved from database
        stats: { total: 0, byDepartment: {}, byLanguage: {} }, // Retrieved from database
        count: members.length,
        total: 0, // Retrieved from database
        timestamp: new Date().toISOString(),
      },
    };

    // Cache unfiltered response in Redis
    if (!department && !role && !search) {
      await redisClient.setex(TEAM_CACHE_KEY, TEAM_CACHE_TTL, JSON.stringify(response));
      logger.info('✅ Team list cached in Redis');
    }

    return res.json(response);
  } catch (error: any) {
    logger.error('team.list error:', error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to retrieve team list',
    });
  }
}

/**
 * Get specific team member
 */
export async function teamGet(req: Request, res: Response) {
  try {
    const { id, email } = req.body.params || {};

    let member;

    // TABULA RASA: Team member MUST be retrieved from database
    // TODO: Replace with database query
    logger.warn('⚠️ Team member lookup using fallback stub - team data should come from database');
    if (id) {
      member = BALI_ZERO_TEAM.members.find((m) => m.id === id); // TODO: Database query
    } else if (email) {
      member = BALI_ZERO_TEAM.members.find((m) => m.email.toLowerCase() === email.toLowerCase()); // TODO: Database query
    } else {
      return res.status(400).json({
        ok: false,
        error: 'Either id or email parameter is required',
      });
    }

    if (!member) {
      return res.status(404).json({
        ok: false,
        error: 'Team member not found',
      });
    }

    return res.json({
      ok: true,
      data: {
        member,
        department: BALI_ZERO_TEAM.departments[member.department] || {}, // TODO: Retrieved from database
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('team.get error:', error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to retrieve team member',
    });
  }
}

/**
 * Get department info
 */
export async function teamDepartments(req: Request, res: Response) {
  try {
    const { name } = req.body.params || {};

    if (name) {
      const department = BALI_ZERO_TEAM.departments[name];
      if (!department) {
        return res.status(404).json({
          ok: false,
          error: 'Department not found',
        });
      }

      const members = BALI_ZERO_TEAM.members.filter((m) => m.department === name);

      return res.json({
        ok: true,
        data: {
          department: {
            ...department,
            id: name,
          },
          members,
          count: members.length,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Return all departments
    // TABULA RASA: Department data MUST be retrieved from database
    // TODO: Replace with database query
    logger.warn('⚠️ Department list using fallback stub - department data should come from database');
    return res.json({
      ok: true,
      data: {
        departments: BALI_ZERO_TEAM.departments, // TODO: Retrieved from database
        stats: BALI_ZERO_TEAM.stats.byDepartment, // TODO: Retrieved from database
        total: Object.keys(BALI_ZERO_TEAM.departments).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('team.departments error:', error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to retrieve departments',
    });
  }
}

// Test handler for collaborator recognition
export async function teamTestRecognition(req: Request, res: Response) {
  try {
    const { email, prompt = 'Ciao, sono un collega. Confermi il mio profilo?' } = req.body;
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Email is required',
      });
    }

    const ragBackendUrl = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    const response = await fetch(`${ragBackendUrl}/bali-zero/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': req.headers['x-api-key'] as string,
        'x-user-id': email, // Pass email as x-user-id header
      },
      body: JSON.stringify({
        query: prompt,
        user_email: email, // Pass email in body for RAG backend
      }),
    });

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({ message: 'Unknown RAG error' }))) as any;
      return res.status(response.status).json({
        ok: false,
        error: errorData.message || `RAG Backend Error: ${response.status}`,
      });
    }

    const data = (await response.json()) as any;
    return res.json({
      ok: data.success,
      status: response.status,
      ms: Date.now() - (req as any).ctx?.startTime || 0,
      model: data.model_used,
      snippet: data.response ? data.response.substring(0, 100) : null,
      full_response: data,
    });
  } catch (error: any) {
    logger.error('team.test.recognition error:', error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Internal Error',
    });
  }
}
