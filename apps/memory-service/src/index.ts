/**
 * NUZANTARA MEMORY SERVICE v1.0
 *
 * Standalone microservice for intelligent memory management
 * Architecture: Multi-layer storage (PostgreSQL, Redis, vector DB, Neo4j)
 *
 * Phase 1: PostgreSQL Foundation
 * - Session management
 * - Conversation history
 * - Collective memory
 * - Basic retrieval
 */

  // Console statements appropriate for service logging
/* eslint-disable @typescript-eslint/no-explicit-any */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { MemoryAnalytics } from './analytics';
import { ConversationSummarizer } from './summarization';
import { FactExtractor } from './fact-extraction';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());

// CORS Configuration - Secure & Minimal
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'https://nuzantara-backend.fly.dev', // Backend-TS (primary caller)
  'http://localhost:3000', // Webapp dev
  'http://localhost:8080', // Local memory service
  'http://127.0.0.1:8080', // Local alternative
];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Serve static files (dashboard)
app.use(express.static(path.join(__dirname, '../public')));

// Database connections
// Only initialize PostgreSQL if DATABASE_URL is provided
const databaseUrl = process.env.DATABASE_URL;
const postgres = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : null;

// Redis (optional - for caching)
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    redis.on('error', (err) => {
      console.warn('⚠️  Redis connection error (caching disabled):', err.message);
    });
    redis.connect().catch((err) => {
      console.warn('⚠️  Redis unavailable, running without cache:', err.message);
      redis = null;
    });
  } catch {
    console.warn('⚠️  Redis initialization failed, running without cache');
    redis = null;
  }
} else {
  console.log('ℹ️  Redis not configured, running without cache');
}

// Initialize Analytics (only if postgres is available)
const analytics = postgres ? new MemoryAnalytics(postgres, redis) : null;

// Initialize Summarizer (only if postgres is available)
const summarizer = postgres ? new ConversationSummarizer(postgres, {
  messageThreshold: 50,
  keepRecentCount: 10,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
}) : null;

// Initialize Fact Extractor (only if postgres is available)
const factExtractor = postgres ? new FactExtractor(postgres, {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  minConfidence: 0.7,
  minImportance: 0.6,
}) : null;

if (!process.env.OPENAI_API_KEY) {
  console.log('⚠️  OpenAI API key not configured - fact extraction disabled');
}

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

async function initializeDatabase() {
  console.log('🔧 Initializing Memory Service Database...');

  if (!postgres) {
    console.log('⚠️  No database configured - running in memory-only mode');
    return;
  }

  try {
    // Table 1: Sessions
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        member_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        last_active TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `);

    // Table 2: Conversation History
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS conversation_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        tokens_used INTEGER DEFAULT 0,
        model_used VARCHAR(100),
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `);

    // Table 3: Collective Memory (shared knowledge)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS collective_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        memory_key VARCHAR(255) UNIQUE NOT NULL,
        memory_type VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        importance_score REAL DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        access_count INTEGER DEFAULT 0,
        last_accessed TIMESTAMP,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `);

    // Table 4: Memory Facts (important user-specific facts)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_facts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        fact_type VARCHAR(100) NOT NULL,
        fact_content TEXT NOT NULL,
        confidence REAL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
        source VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        verified BOOLEAN DEFAULT false,
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `);

    // Table 5: Memory Summaries (consolidated conversations)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        summary_date DATE NOT NULL,
        summary_content TEXT NOT NULL,
        source_message_count INTEGER DEFAULT 0,
        topics TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb,
        UNIQUE (session_id, summary_date)
      )
    `);

    // Migration: Add session_id column if it doesn't exist (for old schemas)
    await postgres.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'memory_summaries' AND column_name = 'session_id'
        ) THEN
          ALTER TABLE memory_summaries ADD COLUMN session_id VARCHAR(255);
          ALTER TABLE memory_summaries ADD COLUMN user_id VARCHAR(255);
        END IF;
      END $$;
    `);

    console.log('✅ Memory Service Database initialized successfully!');

    // Initialize analytics tables (if analytics is available)
    if (analytics) {
      await analytics.initialize();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Initialize on startup
initializeDatabase().catch(console.error);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection (if configured)
    let dbStatus = 'not_configured';
    if (postgres) {
      try {
        const dbTest = await postgres.query('SELECT NOW()');
        dbStatus = dbTest.rows[0] ? 'connected' : 'disconnected';
      } catch (dbError) {
        dbStatus = 'error';
      }
    }

    // Test Redis connection (if configured)
    let redisStatus = 'not_configured';
    if (redis) {
      try {
        const redisTest = await redis.ping();
        redisStatus = redisTest === 'PONG' ? 'connected' : 'disconnected';
      } catch (redisError) {
        redisStatus = 'error';
      }
    }

    const isHealthy = (dbStatus === 'connected' || dbStatus === 'not_configured') &&
                     (redisStatus === 'connected' || redisStatus === 'disconnected' || redisStatus === 'not_configured');

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'memory-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      databases: {
        postgres: dbStatus,
        redis: redisStatus,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper function to check database availability
function requireDatabase(req: Request, res: Response, next: Function) {
  if (!postgres) {
    return res.status(503).json({
      success: false,
      error: 'Database not configured - service running in memory-only mode',
    });
  }
  next();
}

// ============================================================
// LEVEL 1: SESSION MANAGEMENT
// ============================================================

app.post('/api/session/create', requireDatabase, async (req: Request, res: Response) => {
  try {
    const { session_id, user_id, member_name, metadata = {} } = req.body;

    const result = await postgres.query(
      `INSERT INTO memory_sessions (session_id, user_id, member_name, metadata)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id) DO UPDATE
       SET last_active = NOW(), is_active = true
       RETURNING *`,
      [session_id, user_id, member_name, metadata]
    );

    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/session/:session_id', requireDatabase, async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;

    const result = await postgres.query('SELECT * FROM memory_sessions WHERE session_id = $1', [
      session_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// LEVEL 2: CONVERSATION STORAGE
// ============================================================

app.post('/api/conversation/store', async (req: Request, res: Response) => {
  try {
    const {
      session_id,
      user_id,
      message_type,
      content,
      tokens_used,
      model_used,
      metadata = {},
    } = req.body;

    // Store in PostgreSQL
    const result = await postgres.query(
      `INSERT INTO conversation_history
       (session_id, user_id, message_type, content, tokens_used, model_used, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [session_id, user_id, message_type, content, tokens_used || 0, model_used, metadata]
    );

    // Cache last 20 messages in Redis (if available)
    if (redis) {
      const cacheKey = `session:${session_id}:messages`;
      await redis.lpush(cacheKey, JSON.stringify(result.rows[0]));
      await redis.ltrim(cacheKey, 0, 19); // Keep only last 20
      await redis.expire(cacheKey, 3600); // 1 hour TTL
    }

    // Track analytics event
    analytics.trackEvent({
      event_type: 'message_store',
      session_id,
      user_id,
      metadata: { message_type, model_used },
    });

    // Check if conversation needs summarization (non-blocking)
    if (message_type === 'assistant') {
      // Only check after assistant responses to avoid duplicate checks
      summarizer
        .needsSummarization(session_id)
        .then((needsSummarization) => {
          if (needsSummarization) {
            console.log(
              `🔄 Conversation ${session_id} needs summarization - triggering in background`
            );
            // Trigger summarization in background (don't await)
            summarizer
              .summarizeConversation(session_id)
              .then((summary) => {
                if (summary) {
                  console.log(`✅ Auto-summarized conversation ${session_id}`);
                }
              })
              .catch((err) => {
                console.error(`⚠️  Auto-summarization failed for ${session_id}:`, err);
              });
          }
        })
        .catch((err) => {
          console.error(`⚠️  Failed to check summarization need:`, err);
        });
    }

    res.json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Conversation storage error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/conversation/:session_id', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Try Redis cache first (if available)
    if (redis) {
      const cacheKey = `session:${session_id}:messages`;
      const cached = await redis.lrange(cacheKey, 0, limit - 1);

      if (cached.length > 0) {
        const messages = cached.map((msg) => JSON.parse(msg));

        // Track cache hit
        analytics.trackEvent({
          event_type: 'cache_hit',
          session_id,
          metadata: { messages_retrieved: messages.length },
        });

        // Track conversation retrieve
        analytics.trackEvent({
          event_type: 'conversation_retrieve',
          session_id,
          metadata: { messages_retrieved: messages.length, source: 'cache' },
        });

        return res.json({
          success: true,
          messages: messages.reverse(),
          source: 'cache',
        });
      } else {
        // Track cache miss
        analytics.trackEvent({
          event_type: 'cache_miss',
          session_id,
        });
      }
    }

    // Fallback to PostgreSQL (or primary if no Redis)
    const result = await postgres.query(
      `SELECT * FROM conversation_history
       WHERE session_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [session_id, limit]
    );

    // Track conversation retrieve
    analytics.trackEvent({
      event_type: 'conversation_retrieve',
      session_id,
      metadata: { messages_retrieved: result.rows.length, source: 'database' },
    });

    res.json({
      success: true,
      messages: result.rows.reverse(),
      source: 'database',
    });
  } catch (error) {
    console.error('Conversation retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// LEVEL 3: COLLECTIVE MEMORY
// ============================================================

app.post('/api/memory/collective/store', async (req: Request, res: Response) => {
  try {
    const {
      memory_key,
      memory_type,
      content,
      importance_score,
      created_by,
      tags = [],
      metadata = {},
    } = req.body;

    const result = await postgres.query(
      `INSERT INTO collective_memory
       (memory_key, memory_type, content, importance_score, created_by, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (memory_key) DO UPDATE
       SET content = EXCLUDED.content,
           importance_score = EXCLUDED.importance_score,
           updated_at = NOW(),
           access_count = collective_memory.access_count + 1
       RETURNING *`,
      [memory_key, memory_type, content, importance_score || 0.5, created_by, tags, metadata]
    );

    res.json({ success: true, memory: result.rows[0] });
  } catch (error) {
    console.error('Collective memory storage error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/memory/collective/search', async (req: Request, res: Response) => {
  try {
    const { type, min_importance = 0.5, limit = 10 } = req.query;

    let query = `
      SELECT * FROM collective_memory
      WHERE importance_score >= $1
    `;
    const params: any[] = [min_importance];

    if (type) {
      query += ` AND memory_type = $2`;
      params.push(type);
    }

    query += ` ORDER BY importance_score DESC, access_count DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await postgres.query(query, params);

    res.json({
      success: true,
      memories: result.rows,
    });
  } catch (error) {
    console.error('Collective memory search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// LEVEL 4: USER FACTS
// ============================================================

app.post('/api/memory/fact/store', async (req: Request, res: Response) => {
  try {
    const { user_id, fact_type, fact_content, confidence, source, metadata = {} } = req.body;

    const result = await postgres.query(
      `INSERT INTO memory_facts
       (user_id, fact_type, fact_content, confidence, source, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, fact_type, fact_content, confidence || 0.8, source, metadata]
    );

    res.json({ success: true, fact: result.rows[0] });
  } catch (error) {
    console.error('Fact storage error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/memory/fact/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const min_confidence = parseFloat(req.query.min_confidence as string) || 0.7;

    const result = await postgres.query(
      `SELECT * FROM memory_facts
       WHERE user_id = $1 AND confidence >= $2
       ORDER BY confidence DESC, created_at DESC`,
      [user_id, min_confidence]
    );

    res.json({
      success: true,
      facts: result.rows,
    });
  } catch (error) {
    console.error('Fact retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// ANALYTICS
// ============================================================

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await postgres.query(`
      SELECT
        (SELECT COUNT(*) FROM memory_sessions WHERE is_active = true) as active_sessions,
        (SELECT COUNT(*) FROM conversation_history) as total_messages,
        (SELECT COUNT(*) FROM collective_memory) as collective_memories,
        (SELECT COUNT(*) FROM memory_facts) as total_facts,
        (SELECT COUNT(DISTINCT user_id) FROM conversation_history) as unique_users
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/stats/users', async (req: Request, res: Response) => {
  try {
    const users = await postgres.query(`
      SELECT
        user_id,
        member_name,
        COUNT(DISTINCT session_id) as session_count,
        MAX(last_active) as last_active,
        MIN(created_at) as first_seen
      FROM memory_sessions
      GROUP BY user_id, member_name
      ORDER BY session_count DESC
    `);

    res.json({
      success: true,
      users: users.rows,
      total_users: users.rows.length,
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// ADVANCED ANALYTICS
// ============================================================

app.get('/api/analytics/comprehensive', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const analyticsData = await analytics.getAnalytics(days);

    res.json({
      success: true,
      analytics: analyticsData,
      period_days: days,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Comprehensive analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/analytics/realtime', async (req: Request, res: Response) => {
  try {
    const realtimeMetrics = await analytics.getRealTimeMetrics();

    res.json({
      success: true,
      realtime: realtimeMetrics,
    });
  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/analytics/aggregate-daily', async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : undefined;

    await analytics.aggregateDailyStats(targetDate);

    res.json({
      success: true,
      message: 'Daily stats aggregated successfully',
      date: targetDate
        ? targetDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Daily aggregation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/analytics/clean-old-events', async (req: Request, res: Response) => {
  try {
    const deletedCount = await analytics.cleanOldEvents();

    res.json({
      success: true,
      message: `Cleaned ${deletedCount} old analytics events`,
      deleted_count: deletedCount,
    });
  } catch (error) {
    console.error('Analytics cleanup error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// CONVERSATION SUMMARIZATION
// ============================================================

app.post('/api/conversation/summarize/:session_id', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;

    // Check if summarization is needed
    const needsSummarization = await summarizer.needsSummarization(session_id);
    if (!needsSummarization) {
      return res.json({
        success: true,
        message: 'Conversation does not need summarization yet',
        needs_summarization: false,
      });
    }

    // Trigger summarization
    const summary = await summarizer.summarizeConversation(session_id);

    res.json({
      success: true,
      summary,
      needs_summarization: true,
    });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/conversation/:session_id/with-summary', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get conversation with summary
    const result = await summarizer.getConversationWithSummary(session_id, limit);

    // Format context
    const formattedContext = summarizer.formatContextWithSummary(
      result.summary,
      result.recentMessages
    );

    res.json({
      success: true,
      summary: result.summary,
      recent_messages: result.recentMessages,
      has_more: result.hasMore,
      formatted_context: formattedContext,
    });
  } catch (error) {
    console.error('Get conversation with summary error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/conversation/:session_id/summary', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;

    const summary = await summarizer.getSummary(session_id);

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'No summary found for this session',
      });
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

app.post('/api/admin/recreate-summaries-table', async (_req: Request, res: Response) => {
  try {
    console.log('🔧 Recreating memory_summaries table...');

    // Drop existing table
    await postgres.query('DROP TABLE IF EXISTS memory_summaries CASCADE');

    // Recreate with correct schema
    await postgres.query(`
      CREATE TABLE memory_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        summary_date DATE NOT NULL,
        summary_content TEXT NOT NULL,
        source_message_count INTEGER DEFAULT 0,
        topics TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb,
        UNIQUE (session_id, summary_date)
      )
    `);

    console.log('✅ memory_summaries table recreated successfully');

    res.json({
      success: true,
      message: 'memory_summaries table recreated successfully',
    });
  } catch (error) {
    console.error('❌ Failed to recreate table:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/admin/optimize-database', async (_req: Request, res: Response) => {
  try {
    console.log('🔧 Optimizing database with performance indexes...');

    const optimizations = [];

    // Index 1: session_id for faster lookups
    try {
      await postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_memory_messages_session_id
        ON memory_messages(session_id)
      `);
      optimizations.push('idx_memory_messages_session_id');
    } catch (err: any) {
      console.warn('⚠️  Failed to create idx_memory_messages_session_id:', err.message);
    }

    // Index 2: created_at for time-based queries
    try {
      await postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_memory_messages_created_at
        ON memory_messages(created_at DESC)
      `);
      optimizations.push('idx_memory_messages_created_at');
    } catch (err: any) {
      console.warn('⚠️  Failed to create idx_memory_messages_created_at:', err.message);
    }

    // Index 3: Composite index for session + time queries
    try {
      await postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_memory_messages_session_created
        ON memory_messages(session_id, created_at DESC)
      `);
      optimizations.push('idx_memory_messages_session_created');
    } catch (err: any) {
      console.warn('⚠️  Failed to create idx_memory_messages_session_created:', err.message);
    }

    // Index 4: user_id for user-specific queries
    try {
      await postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_memory_sessions_user_id
        ON memory_sessions(user_id)
      `);
      optimizations.push('idx_memory_sessions_user_id');
    } catch (err: any) {
      console.warn('⚠️  Failed to create idx_memory_sessions_user_id:', err.message);
    }

    // Index 5: session created_at for cleanup queries
    try {
      await postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_memory_sessions_created_at
        ON memory_sessions(created_at DESC)
      `);
      optimizations.push('idx_memory_sessions_created_at');
    } catch (err: any) {
      console.warn('⚠️  Failed to create idx_memory_sessions_created_at:', err.message);
    }

    // Analyze tables to update statistics
    try {
      await postgres.query('ANALYZE memory_sessions');
      optimizations.push('ANALYZE memory_sessions');
    } catch (err: any) {
      console.warn('⚠️  Failed to analyze memory_sessions:', err.message);
    }

    try {
      await postgres.query('ANALYZE memory_messages');
      optimizations.push('ANALYZE memory_messages');
    } catch (err: any) {
      console.warn('⚠️  Failed to analyze memory_messages:', err.message);
    }

    try {
      await postgres.query('ANALYZE memory_summaries');
      optimizations.push('ANALYZE memory_summaries');
    } catch (err: any) {
      console.warn('⚠️  Failed to analyze memory_summaries:', err.message);
    }

    console.log('✅ Database optimization completed');
    console.log(`✅ Applied ${optimizations.length} optimizations:`, optimizations);

    res.json({
      success: true,
      message: 'Database optimization completed successfully',
      optimizations_applied: optimizations.length,
      optimizations,
    });
  } catch (error) {
    console.error('❌ Failed to optimize database:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/admin/cleanup-old-sessions', async (req: Request, res: Response) => {
  try {
    const { days = 30, dryRun = false } = req.body;

    console.log(
      `🧹 ${dryRun ? 'Simulating' : 'Executing'} cleanup of sessions older than ${days} days...`
    );

    // Find old sessions
    const oldSessionsQuery = await postgres.query(
      `SELECT session_id, user_id, member_name, created_at, last_active,
              (SELECT COUNT(*) FROM memory_messages WHERE memory_messages.session_id = memory_sessions.session_id) as message_count
       FROM memory_sessions
       WHERE last_active < NOW() - INTERVAL '${days} days'
       ORDER BY last_active ASC`
    );

    const sessionsToDelete = oldSessionsQuery.rows;

    if (sessionsToDelete.length === 0) {
      return res.json({
        success: true,
        message: 'No old sessions found',
        deleted_count: 0,
        dry_run: dryRun,
      });
    }

    let deletedSessions = 0;
    let deletedMessages = 0;

    if (!dryRun) {
      // Delete messages first (foreign key constraint)
      for (const session of sessionsToDelete) {
        const msgResult = await postgres.query(
          'DELETE FROM memory_messages WHERE session_id = $1',
          [session.session_id]
        );
        deletedMessages += msgResult.rowCount || 0;
      }

      // Delete sessions
      const sessionIds = sessionsToDelete.map((s) => s.session_id);
      const sessionResult = await postgres.query(
        'DELETE FROM memory_sessions WHERE session_id = ANY($1::text[])',
        [sessionIds]
      );
      deletedSessions = sessionResult.rowCount || 0;

      console.log(`✅ Cleaned up ${deletedSessions} sessions and ${deletedMessages} messages`);
    }

    res.json({
      success: true,
      message: dryRun
        ? `Would delete ${sessionsToDelete.length} sessions`
        : `Successfully deleted ${deletedSessions} sessions and ${deletedMessages} messages`,
      deleted_sessions: dryRun ? 0 : deletedSessions,
      deleted_messages: dryRun ? 0 : deletedMessages,
      sessions_to_delete: sessionsToDelete.length,
      dry_run: dryRun,
      preview: sessionsToDelete.slice(0, 10).map((s) => ({
        session_id: s.session_id,
        user: s.member_name || s.user_id,
        last_active: s.last_active,
        message_count: s.message_count,
      })),
    });
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/admin/cleanup-stats', async (req: Request, res: Response) => {
  try {
    const stats = await postgres.query(`
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN last_active > NOW() - INTERVAL '7 days' THEN 1 END) as active_last_7_days,
        COUNT(CASE WHEN last_active > NOW() - INTERVAL '30 days' THEN 1 END) as active_last_30_days,
        COUNT(CASE WHEN last_active < NOW() - INTERVAL '30 days' THEN 1 END) as older_than_30_days,
        COUNT(CASE WHEN last_active < NOW() - INTERVAL '90 days' THEN 1 END) as older_than_90_days
      FROM memory_sessions
    `);

    const messageCounts = await postgres.query(`
      SELECT
        COUNT(*) as total_messages,
        (SELECT COUNT(*) FROM memory_messages
         WHERE session_id IN (
           SELECT session_id FROM memory_sessions
           WHERE last_active < NOW() - INTERVAL '30 days'
         )) as messages_in_old_sessions
      FROM memory_messages
    `);

    res.json({
      success: true,
      stats: {
        ...stats.rows[0],
        ...messageCounts.rows[0],
      },
    });
  } catch (error) {
    console.error('Cleanup stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/admin/database-size', async (req: Request, res: Response) => {
  try {
    // Get database size
    const dbSize = await postgres.query(`
      SELECT
        pg_database.datname as database_name,
        pg_size_pretty(pg_database_size(pg_database.datname)) as size_pretty,
        pg_database_size(pg_database.datname) as size_bytes
      FROM pg_database
      WHERE datname = current_database()
    `);

    // Get table sizes
    const tableSizes = await postgres.query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    // Row counts
    const rowCounts = await postgres.query(`
      SELECT
        'memory_sessions' as table_name,
        COUNT(*) as row_count
      FROM memory_sessions
      UNION ALL
      SELECT 'memory_messages', COUNT(*) FROM memory_messages
      UNION ALL
      SELECT 'memory_summaries', COUNT(*) FROM memory_summaries
      UNION ALL
      SELECT 'collective_memory', COUNT(*) FROM collective_memory
      UNION ALL
      SELECT 'memory_facts', COUNT(*) FROM memory_facts
    `);

    const totalSizeBytes = dbSize.rows[0]?.size_bytes || 0;
    const totalSizeMB = Math.round(totalSizeBytes / (1024 * 1024));
    const alertThreshold = 800; // 800MB
    const criticalThreshold = 950; // 950MB (close to 1GB limit)

    const status =
      totalSizeMB >= criticalThreshold
        ? 'critical'
        : totalSizeMB >= alertThreshold
          ? 'warning'
          : 'healthy';

    res.json({
      success: true,
      status,
      database: {
        ...dbSize.rows[0],
        size_mb: totalSizeMB,
        usage_percent: Math.round((totalSizeMB / 1024) * 100),
      },
      tables: tableSizes.rows,
      row_counts: rowCounts.rows,
      alerts: {
        should_alert: status !== 'healthy',
        message:
          status === 'critical'
            ? '🚨 CRITICAL: Database size exceeds 950MB! Cleanup required immediately.'
            : status === 'warning'
              ? '⚠️ WARNING: Database size exceeds 800MB. Consider cleanup.'
              : '✅ Database size is healthy',
        threshold_mb: alertThreshold,
        critical_threshold_mb: criticalThreshold,
      },
    });
  } catch (error) {
    console.error('Database size check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/admin/growth-projection', async (req: Request, res: Response) => {
  try {
    // Calculate daily growth rate
    const growthData = await postgres.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as new_sessions,
        (SELECT COUNT(*) FROM memory_messages WHERE DATE(created_at) = DATE(memory_sessions.created_at)) as new_messages
      FROM memory_sessions
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get current size
    const currentSize = await postgres.query(`
      SELECT pg_database_size(current_database()) as size_bytes
    `);

    const sizeBytes = currentSize.rows[0]?.size_bytes || 0;
    const sizeMB = sizeBytes / (1024 * 1024);

    // Simple projection: assume average daily growth
    const dailyGrowth =
      growthData.rows.length > 0
        ? growthData.rows.reduce((sum, row) => sum + (row.new_sessions || 0), 0) /
          growthData.rows.length
        : 0;

    const avgMessageSize = 1024; // 1KB per message estimate
    const estimatedDailyGrowthMB = (dailyGrowth * avgMessageSize) / (1024 * 1024);

    const daysUntil800MB =
      estimatedDailyGrowthMB > 0 ? Math.floor((800 - sizeMB) / estimatedDailyGrowthMB) : Infinity;

    const daysUntil1GB =
      estimatedDailyGrowthMB > 0 ? Math.floor((1024 - sizeMB) / estimatedDailyGrowthMB) : Infinity;

    res.json({
      success: true,
      current_size_mb: Math.round(sizeMB),
      daily_growth: {
        sessions_per_day: Math.round(dailyGrowth),
        estimated_mb_per_day: estimatedDailyGrowthMB.toFixed(2),
      },
      projections: {
        days_until_800mb: daysUntil800MB === Infinity ? 'N/A' : daysUntil800MB,
        days_until_1gb: daysUntil1GB === Infinity ? 'N/A' : daysUntil1GB,
        estimated_date_800mb:
          daysUntil800MB === Infinity
            ? 'N/A'
            : new Date(Date.now() + daysUntil800MB * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
        estimated_date_1gb:
          daysUntil1GB === Infinity
            ? 'N/A'
            : new Date(Date.now() + daysUntil1GB * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      recent_growth: growthData.rows,
    });
  } catch (error) {
    console.error('Growth projection failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// FACT EXTRACTION
// ============================================================

/**
 * POST /api/facts/extract/:session_id
 * Extract facts from a conversation session
 */
app.post('/api/facts/extract/:session_id', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required',
      });
    }

    console.log(`🔍 Extracting facts from session ${session_id}...`);

    const factsStored = await factExtractor.processSession(session_id, user_id);

    res.json({
      success: true,
      session_id,
      facts_extracted: factsStored,
      message: `Successfully extracted and stored ${factsStored} facts`,
    });
  } catch (error) {
    console.error('Fact extraction error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/facts/relevant
 * Get relevant collective memories for a context
 */
app.get('/api/facts/relevant', async (req: Request, res: Response) => {
  try {
    const context = req.query.context as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'context parameter is required',
      });
    }

    const memories = await factExtractor.getRelevantMemories(context, limit);

    res.json({
      success: true,
      memories,
      count: memories.length,
    });
  } catch (error) {
    console.error('Get relevant memories error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/facts/batch-extract
 * Extract facts from multiple recent sessions
 */
app.post('/api/facts/batch-extract', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 10 } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required',
      });
    }

    console.log(`🔍 Batch extracting facts for user ${user_id}...`);

    // Get recent sessions for user
    const sessionsResult = await postgres.query(
      `SELECT DISTINCT session_id
       FROM conversation_history
       WHERE user_id = $1
       ORDER BY session_id DESC
       LIMIT $2`,
      [user_id, limit]
    );

    const sessions = sessionsResult.rows.map((row) => row.session_id);
    let totalFacts = 0;

    for (const sessionId of sessions) {
      try {
        const facts = await factExtractor.processSession(sessionId, user_id);
        totalFacts += facts;
      } catch (error) {
        console.error(`Failed to process session ${sessionId}:`, error);
      }
    }

    res.json({
      success: true,
      sessions_processed: sessions.length,
      facts_extracted: totalFacts,
      message: `Processed ${sessions.length} sessions, extracted ${totalFacts} facts`,
    });
  } catch (error) {
    console.error('Batch extraction error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/facts/stats
 * Get statistics about extracted facts
 */
app.get('/api/facts/stats', async (req: Request, res: Response) => {
  try {
    const stats = await postgres.query(`
      SELECT
        COUNT(*) as total_facts,
        COUNT(DISTINCT memory_type) as fact_types,
        AVG(importance_score) as avg_importance,
        SUM(access_count) as total_accesses,
        COUNT(DISTINCT created_by) as contributors
      FROM collective_memory
    `);

    const topFacts = await postgres.query(`
      SELECT memory_type, content, importance_score, access_count
      FROM collective_memory
      ORDER BY importance_score DESC, access_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
      top_facts: topFacts.rows,
    });
  } catch (error) {
    console.error('Facts stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log('🧠 ========================================');
  console.log('🧠 NUZANTARA MEMORY SERVICE v1.0');
  console.log('🧠 ========================================');
  console.log(`🧠 Port: ${PORT}`);
  console.log(`🧠 Health: http://localhost:${PORT}/health`);
  console.log(`🧠 Stats: http://localhost:${PORT}/api/stats`);
  console.log('🧠 ========================================');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Memory Service...');
  if (postgres) await postgres.end();
  if (redis) await redis.quit();
  process.exit(0);
});
