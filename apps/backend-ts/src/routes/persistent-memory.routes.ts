/**
 * ZANTARA V4.0 - Persistent Memory Routes
 *
 * Implements the 4 core memory systems:
 * 1. Database-backed session management
 * 2. Conversation history storage
 * 3. Cross-session context retrieval
 * 4. Collective intelligence sharing
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { logger } from '../logging/unified-logger.js';

const router = Router();

// Database connection
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:password@nuzantara-postgres.internal:5432/zantara_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Interface definitions
interface PersistentSession {
  id?: string;
  session_id: string;
  user_id: string;
  member_name: string;
  language: string;
  created_at?: Date;
  updated_at?: Date;
  expires_at?: Date;
  is_active?: boolean;
  metadata?: any;
}

interface ConversationMessage {
  id?: string;
  session_id: string;
  message_id?: string;
  message_type: 'user' | 'assistant' | 'system';
  member_name?: string;
  message_content: string;
  language_detected?: string;
  timestamp?: Date;
  context_metadata?: any;
  processing_time_ms?: number;
  tokens_used?: number;
}

interface CollectiveMemory {
  id?: string;
  memory_key: string;
  memory_type: string;
  memory_content: string;
  related_members?: string[];
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
  expires_at?: Date;
  access_count?: number;
  confidence_score?: number;
  tags?: string[];
  metadata?: any;
}

/**
 * Initialize database schema on startup
 */
async function initializeDatabase() {
  try {
    logger.info('🔥 Initializing ZANTARA V4.0 Persistent Memory Schema...');

    // Create extensions
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Create tables
    await createPersistentSessionsTable();
    await createConversationHistoryTable();
    await createCollectiveMemoryTable();
    await createCrossSessionContextTable();
    await createTeamKnowledgeSharingTable();
    await createMemoryAnalyticsTable();
    await createMemoryCacheTable();

    // Create indexes
    await createIndexes();

    // Create triggers and functions
    await createTriggers();

    // Insert seed data
    await insertSeedData();

    logger.info('✅ ZANTARA V4.0 Persistent Memory Schema initialized successfully!');
  } catch (error) {
    logger.error('❌ Failed to initialize persistent memory schema:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Create persistent_sessions table
 */
async function createPersistentSessionsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS persistent_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR(255) UNIQUE NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      member_name VARCHAR(255) NOT NULL,
      language VARCHAR(10) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      is_active BOOLEAN DEFAULT true,
      metadata JSONB DEFAULT '{}'
    )
  `;
  await pool.query(query);
}

/**
 * Create conversation_history table
 */
async function createConversationHistoryTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS conversation_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR(255) NOT NULL,
      message_id UUID DEFAULT gen_random_uuid(),
      message_type VARCHAR(50) NOT NULL,
      member_name VARCHAR(255),
      message_content TEXT NOT NULL,
      language_detected VARCHAR(10),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      context_metadata JSONB DEFAULT '{}',
      processing_time_ms INTEGER,
      tokens_used INTEGER DEFAULT 0
    )
  `;
  await pool.query(query);
}

/**
 * Create collective_memory table
 */
async function createCollectiveMemoryTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS collective_memory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      memory_key VARCHAR(255) NOT NULL,
      memory_type VARCHAR(100) NOT NULL,
      memory_content TEXT NOT NULL,
      related_members TEXT[],
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      access_count INTEGER DEFAULT 0,
      confidence_score DECIMAL(3,2) DEFAULT 1.0,
      tags TEXT[],
      metadata JSONB DEFAULT '{}'
    )
  `;
  await pool.query(query);
}

/**
 * Create cross_session_context table
 */
async function createCrossSessionContextTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS cross_session_context (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      context_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      session_ids TEXT[] NOT NULL,
      context_type VARCHAR(100) NOT NULL,
      context_data JSONB NOT NULL,
      member_involvement TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      is_active BOOLEAN DEFAULT true
    )
  `;
  await pool.query(query);
}

/**
 * Create team_knowledge_sharing table
 */
async function createTeamKnowledgeSharingTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS team_knowledge_sharing (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      knowledge_id VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      knowledge_type VARCHAR(100) NOT NULL,
      contributor VARCHAR(255) NOT NULL,
      contributors TEXT[],
      department VARCHAR(100),
      tags TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      access_level VARCHAR(50) DEFAULT 'team',
      usage_count INTEGER DEFAULT 0,
      effectiveness_score DECIMAL(3,2),
      metadata JSONB DEFAULT '{}'
    )
  `;
  await pool.query(query);
}

/**
 * Create memory_analytics table
 */
async function createMemoryAnalyticsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS memory_analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR(255),
      user_id VARCHAR(255),
      member_name VARCHAR(255),
      event_type VARCHAR(100) NOT NULL,
      event_data JSONB NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      processing_time_ms INTEGER
    )
  `;
  await pool.query(query);
}

/**
 * Create memory_cache table
 */
async function createMemoryCacheTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS memory_cache (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cache_key VARCHAR(500) UNIQUE NOT NULL,
      cache_value JSONB NOT NULL,
      cache_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      hit_count INTEGER DEFAULT 0,
      last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'
    )
  `;
  await pool.query(query);
}

/**
 * Create database indexes
 */
async function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON persistent_sessions(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON persistent_sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_member ON persistent_sessions(member_name)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_active ON persistent_sessions(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON persistent_sessions(expires_at)',

    'CREATE INDEX IF NOT EXISTS idx_conversation_session ON conversation_history(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_conversation_timestamp ON conversation_history(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_conversation_member ON conversation_history(member_name)',
    'CREATE INDEX IF NOT EXISTS idx_conversation_type ON conversation_history(message_type)',
    'CREATE INDEX IF NOT EXISTS idx_conversation_language ON conversation_history(language_detected)',

    'CREATE INDEX IF NOT EXISTS idx_collective_key ON collective_memory(memory_key)',
    'CREATE INDEX IF NOT EXISTS idx_collective_type ON collective_memory(memory_type)',
    'CREATE INDEX IF NOT EXISTS idx_collective_members ON collective_memory(related_members)',
    'CREATE INDEX IF NOT EXISTS idx_collective_created ON collective_memory(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_collective_tags ON collective_memory(tags)',

    'CREATE INDEX IF NOT EXISTS idx_context_id ON cross_session_context(context_id)',
    'CREATE INDEX IF NOT EXISTS idx_context_user ON cross_session_context(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_context_type ON cross_session_context(context_type)',
    'CREATE INDEX IF NOT EXISTS idx_context_active ON cross_session_context(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_context_last_accessed ON cross_session_context(last_accessed)',

    'CREATE INDEX IF NOT EXISTS idx_knowledge_id ON team_knowledge_sharing(knowledge_id)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_type ON team_knowledge_sharing(knowledge_type)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_contributor ON team_knowledge_sharing(contributor)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON team_knowledge_sharing(tags)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_department ON team_knowledge_sharing(department)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_access ON team_knowledge_sharing(access_level)',

    'CREATE INDEX IF NOT EXISTS idx_analytics_session ON memory_analytics(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_user ON memory_analytics(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_member ON memory_analytics(member_name)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_event ON memory_analytics(event_type)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON memory_analytics(timestamp)',

    'CREATE INDEX IF NOT EXISTS idx_cache_key ON memory_cache(cache_key)',
    'CREATE INDEX IF NOT EXISTS idx_cache_type ON memory_cache(cache_type)',
    'CREATE INDEX IF NOT EXISTS idx_cache_expires ON memory_cache(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_cache_accessed ON memory_cache(last_accessed)',

    // GIN indexes for arrays and JSONB
    'CREATE INDEX IF NOT EXISTS idx_collective_members_gin ON collective_memory USING GIN (related_members)',
    'CREATE INDEX IF NOT EXISTS idx_context_sessions_gin ON cross_session_context USING GIN (session_ids)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_tags_gin ON team_knowledge_sharing USING GIN (tags)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_contributors_gin ON team_knowledge_sharing USING GIN (contributors)',
    'CREATE INDEX IF NOT EXISTS idx_conversation_metadata_gin ON conversation_history USING GIN (context_metadata)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_metadata_gin ON persistent_sessions USING GIN (metadata)',
    'CREATE INDEX IF NOT EXISTS idx_collective_metadata_gin ON collective_memory USING GIN (metadata)',
    'CREATE INDEX IF NOT EXISTS idx_context_data_gin ON cross_session_context USING GIN (context_data)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_metadata_gin ON team_knowledge_sharing USING GIN (metadata)',
    'CREATE INDEX IF NOT EXISTS idx_cache_value_gin ON memory_cache USING GIN (cache_value)',
  ];

  for (const indexQuery of indexes) {
    await pool.query(indexQuery);
  }
}

/**
 * Create triggers and functions
 */
async function createTriggers() {
  // Create update_updated_at_column function
  await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  // Create triggers
  const triggers = [
    'DROP TRIGGER IF EXISTS update_persistent_sessions_updated_at ON persistent_sessions',
    'CREATE TRIGGER update_persistent_sessions_updated_at BEFORE UPDATE ON persistent_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',

    'DROP TRIGGER IF EXISTS update_conversation_history_updated_at ON conversation_history',
    'CREATE TRIGGER update_conversation_history_updated_at BEFORE UPDATE ON conversation_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',

    'DROP TRIGGER IF EXISTS update_collective_memory_updated_at ON collective_memory',
    'CREATE TRIGGER update_collective_memory_updated_at BEFORE UPDATE ON collective_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',

    'DROP TRIGGER IF EXISTS update_cross_session_context_updated_at ON cross_session_context',
    'CREATE TRIGGER update_cross_session_context_updated_at BEFORE UPDATE ON cross_session_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',

    'DROP TRIGGER IF EXISTS update_team_knowledge_sharing_updated_at ON team_knowledge_sharing',
    'CREATE TRIGGER update_team_knowledge_sharing_updated_at BEFORE UPDATE ON team_knowledge_sharing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
  ];

  for (const triggerQuery of triggers) {
    await pool.query(triggerQuery);
  }
}

/**
 * Insert seed data
 */
async function insertSeedData() {
  // Insert test sessions
  await pool.query(`
    INSERT INTO persistent_sessions (session_id, user_id, member_name, language, expires_at) VALUES
    ('test-session-001', 'test-user', 'Zero', 'it', NOW() + INTERVAL '24 hours'),
    ('test-session-002', 'test-user', 'Surya', 'id', NOW() + INTERVAL '24 hours'),
    ('test-session-003', 'test-user', 'Olena', 'ua', NOW() + INTERVAL '24 hours')
    ON CONFLICT (session_id) DO NOTHING
  `);

  // Insert test collective memory
  await pool.query(`
    INSERT INTO collective_memory (memory_key, memory_type, memory_content, related_members, created_by, tags) VALUES
    ('client-microsoft-cloud', 'client_info', 'Microsoft customer for cloud migration project', ARRAY['Surya', 'Adit', 'Marta'], 'system', ARRAY['cloud', 'migration', 'microsoft']),
    ('project-blockchain', 'project', 'Blockchain implementation for supply chain management', ARRAY['Zero', 'Ruslana', 'Adit'], 'system', ARRAY['blockchain', 'supply-chain', 'technical']),
    ('decision-office-jakarta', 'decision', 'Decision to open new office in Jakarta SCBD area', ARRAY['Zero', 'Surya', 'Olena'], 'system', ARRAY['office', 'jakarta', 'expansion'])
    ON CONFLICT DO NOTHING
  `);
}

/**
 * Persistent Memory Manager Class
 */
export class PersistentMemoryManager {
  /**
   * Create or update session
   */
  async createOrUpdateSession(session: PersistentSession): Promise<PersistentSession> {
    const query = `
      INSERT INTO persistent_sessions (session_id, user_id, member_name, language, expires_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (session_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        member_name = EXCLUDED.member_name,
        language = EXCLUDED.language,
        expires_at = EXCLUDED.expires_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      session.session_id,
      session.user_id,
      session.member_name,
      session.language,
      session.expires_at,
      JSON.stringify(session.metadata || {}),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Save conversation message
   */
  async saveConversationMessage(message: ConversationMessage): Promise<ConversationMessage> {
    const query = `
      INSERT INTO conversation_history (
        session_id, message_type, member_name, message_content,
        language_detected, context_metadata, processing_time_ms, tokens_used
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      message.session_id,
      message.message_type,
      message.member_name,
      message.message_content,
      message.language_detected,
      JSON.stringify(message.context_metadata || {}),
      message.processing_time_ms,
      message.tokens_used || 0,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get conversation history for session
   */
  async getConversationHistory(
    sessionId: string,
    limit: number = 50
  ): Promise<ConversationMessage[]> {
    const query = `
      SELECT * FROM conversation_history
      WHERE session_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [sessionId, limit]);
    return result.rows;
  }

  /**
   * Save collective memory
   */
  async saveCollectiveMemory(memory: CollectiveMemory): Promise<CollectiveMemory> {
    const query = `
      INSERT INTO collective_memory (
        memory_key, memory_type, memory_content, related_members,
        created_by, tags, metadata, confidence_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (memory_key)
      DO UPDATE SET
        memory_type = EXCLUDED.memory_type,
        memory_content = EXCLUDED.memory_content,
        related_members = EXCLUDED.related_members,
        tags = EXCLUDED.tags,
        metadata = EXCLUDED.metadata,
        confidence_score = EXCLUDED.confidence_score,
        access_count = collective_memory.access_count + 1,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      memory.memory_key,
      memory.memory_type,
      memory.memory_content,
      memory.related_members,
      memory.created_by,
      memory.tags,
      JSON.stringify(memory.metadata || {}),
      memory.confidence_score || 1.0,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Search collective memory
   */
  async searchCollectiveMemory(query: string, memoryType?: string): Promise<CollectiveMemory[]> {
    let searchQuery = `
      SELECT * FROM collective_memory
      WHERE (memory_content ILIKE $1 OR memory_key ILIKE $1 OR $1 = ANY(tags))
    `;

    const values = [`%${query}%`];

    if (memoryType) {
      searchQuery += ` AND memory_type = $2`;
      values.push(memoryType);
    }

    searchQuery += ` ORDER BY access_count DESC, confidence_score DESC LIMIT 20`;

    const result = await pool.query(searchQuery, values);
    return result.rows;
  }

  /**
   * Get active session for user
   */
  async getActiveSession(userId: string, memberName?: string): Promise<PersistentSession | null> {
    let query = `
      SELECT * FROM persistent_sessions
      WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
    `;

    const values = [userId];

    if (memberName) {
      query += ` AND member_name = $2`;
      values.push(memberName);
    }

    query += ` ORDER BY updated_at DESC LIMIT 1`;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await pool.query(`
      UPDATE persistent_sessions SET is_active = false
      WHERE expires_at < NOW()
    `);

    await pool.query(`
      DELETE FROM memory_cache
      WHERE expires_at < NOW()
    `);
  }
}

// Export singleton instance
export const persistentMemoryManager = new PersistentMemoryManager();

/**
 * Routes
 */

// Initialize database on route load
initializeDatabase().catch((error) => {
  logger.error('Failed to initialize persistent memory database:', error instanceof Error ? error : new Error(String(error)));
});

/**
 * POST /api/persistent-memory/session
 * Create or update session
 */
router.post('/session', async (req: Request, res: Response) => {
  try {
    const session = await persistentMemoryManager.createOrUpdateSession(req.body);
    res.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error creating/updating session:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: 'Failed to create/update session' });
  }
});

/**
 * GET /api/persistent-memory/session/:userId
 * Get active session for user
 */
router.get('/session/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { memberName } = req.query;

    const session = await persistentMemoryManager.getActiveSession(userId, memberName as string);
    res.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error getting active session:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: 'Failed to get active session' });
  }
});

/**
 * POST /api/persistent-memory/message
 * Save conversation message
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const message = await persistentMemoryManager.saveConversationMessage(req.body);
    res.json({ success: true, data: message });
  } catch (error) {
    logger.error('Error saving conversation message:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: 'Failed to save conversation message' });
  }
});

/**
 * GET /api/persistent-memory/history/:sessionId
 * Get conversation history for session
 */
router.get('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const history = await persistentMemoryManager.getConversationHistory(sessionId, Number(limit));
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error getting conversation history:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: 'Failed to get conversation history' });
  }
});

/**
 * POST /api/persistent-memory/collective
 * Save collective memory
 */
router.post('/collective', async (req: Request, res: Response) => {
  try {
    const memory = await persistentMemoryManager.saveCollectiveMemory(req.body);
    res.json({ success: true, data: memory });
  } catch (error) {
    logger.error('Error saving collective memory:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: 'Failed to save collective memory' });
  }
});

/**
 * GET /api/persistent-memory/collective/search
 * Search collective memory
 */
router.get('/collective/search', async (req: Request, res: Response) => {
  try {
    const { q: query, type } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    const results = await persistentMemoryManager.searchCollectiveMemory(
      query as string,
      type as string
    );
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error searching collective memory:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: 'Failed to search collective memory' });
  }
});

/**
 * POST /api/persistent-memory/cleanup
 * Clean up expired sessions and cache
 */
router.post('/cleanup', async (_req: Request, res: Response) => {
  try {
    await persistentMemoryManager.cleanupExpiredSessions();
    res.json({ success: true, message: 'Cleanup completed successfully' });
  } catch (error) {
    logger.error('Error during cleanup:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: 'Failed to perform cleanup' });
  }
});

/**
 * GET /api/persistent-memory/status
 * Get system status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    const dbTest = await pool.query('SELECT NOW() as current_time, current_database() as database');

    // Count records in each table
    const [sessionsCount, conversationsCount, memoryCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM persistent_sessions WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM conversation_history'),
      pool.query('SELECT COUNT(*) as count FROM collective_memory'),
    ]);

    res.json({
      success: true,
      data: {
        database: {
          connected: true,
          current_time: dbTest.rows[0].current_time,
          database: dbTest.rows[0].database,
        },
        tables: {
          active_sessions: parseInt(sessionsCount.rows[0].count),
          total_conversations: parseInt(conversationsCount.rows[0].count),
          collective_memories: parseInt(memoryCount.rows[0].count),
        },
        version: '4.0.0',
        features: [
          'Database-backed session management',
          'Conversation history storage',
          'Collective intelligence sharing',
          'Cross-session context retrieval',
        ],
      },
    });
  } catch (error) {
    logger.error('Error getting system status:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      database: { connected: false },
    });
  }
});

export default router;
