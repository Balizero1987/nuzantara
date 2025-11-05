/**
 * NUZANTARA MEMORY SERVICE v1.0
 *
 * Standalone microservice for intelligent memory management
 * Architecture: Multi-layer storage (PostgreSQL, Redis, ChromaDB, Neo4j)
 *
 * Phase 1: PostgreSQL Foundation
 * - Session management
 * - Conversation history
 * - Collective memory
 * - Basic retrieval
 */

/* eslint-disable no-console */ // Console statements appropriate for service logging
/* eslint-disable @typescript-eslint/no-explicit-any */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { MemoryAnalytics } from './analytics';
import { ConversationSummarizer } from './summarization';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Database connections
const postgres = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/memory_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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

// Initialize Analytics
const analytics = new MemoryAnalytics(postgres, redis);

// Initialize Summarizer
const summarizer = new ConversationSummarizer(postgres, {
  messageThreshold: 50,
  keepRecentCount: 10,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
});

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

async function initializeDatabase() {
  console.log('🔧 Initializing Memory Service Database...');

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

    // Initialize analytics tables
    await analytics.initialize();
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
    // Test database connection
    const dbTest = await postgres.query('SELECT NOW()');
    const redisTest = redis ? await redis.ping() : 'disabled';

    res.json({
      status: 'healthy',
      service: 'memory-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      databases: {
        postgres: dbTest.rows[0] ? 'connected' : 'disconnected',
        redis: redisTest === 'PONG' ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// LEVEL 1: SESSION MANAGEMENT
// ============================================================

app.post('/api/session/create', async (req: Request, res: Response) => {
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

app.get('/api/session/:session_id', async (req: Request, res: Response) => {
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
  await postgres.end();
  if (redis) await redis.quit();
  process.exit(0);
});
