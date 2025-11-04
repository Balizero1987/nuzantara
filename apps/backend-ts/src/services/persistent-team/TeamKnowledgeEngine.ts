import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

// =====================================================
// INTERFACES PERSISTENT TEAM KNOWLEDGE
// =====================================================

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  pin?: string;
  department: string;
  bio?: string;
  name_variations: string[];
  role_keywords: string[];
  expertise_areas: string[];
  reports_to?: string;
  manages: string[];
  collaborates_with: string[];
  availability_status: 'online' | 'offline' | 'busy';
  verification_status: 'verified' | 'pending' | 'unverified';
  confidence_score: number;
  last_updated: Date;
  created_at: Date;
}

export interface CollectiveMemory {
  id: string;
  session_id: string;
  user_id: string;
  query_text: string;
  response_text: string;
  query_type?: string;
  team_members_mentioned: string[];
  topics_discussed: string[];
  response_quality_score?: number;
  user_satisfaction_rating?: number;
  created_at: Date;
}

export interface TeamRelationship {
  id: string;
  member_a: string;
  member_b: string;
  relationship_type: 'reports_to' | 'manages' | 'collaborates_with' | 'mentorship';
  relationship_strength: number;
  interaction_frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  projects_together: string[];
  confidence_level: number;
  last_interaction?: Date;
}

export interface TeamInteraction {
  id: string;
  session_id: string;
  user_id: string;
  primary_member_mentioned?: string;
  secondary_members_mentioned: string[];
  interaction_type: string;
  interaction_sentiment?: 'positive' | 'neutral' | 'negative';
  original_query: string;
  member_recognition_success: boolean;
  recognition_confidence: number;
  business_context: any;
  user_intent: any;
  created_at: Date;
}

export interface RecognitionResult {
  member_found: boolean;
  member?: TeamMember;
  confidence: number;
  match_type: 'exact_match' | 'variation_match' | 'partial_match' | 'fuzzy_match';
  related_members: TeamMember[];
  context: {
    recent_mentions: number;
    user_interactions: number;
    relationship_context: string[];
  };
}

export interface PersistentMemory {
  member_recognition: RecognitionResult;
  collective_context: {
    recent_discussions: Array<{
      topic: string;
      date: Date;
      participants: string[];
    }>;
    user_history: Array<{
      query: string;
      response: string;
      date: Date;
      satisfaction?: number;
    }>;
    relationship_network: TeamRelationship[];
  };
}

// =====================================================
// TEAM KNOWLEDGE DATABASE CLASS
// =====================================================

export class TeamKnowledgeDatabase {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async initialize(): Promise<void> {
    // Test connection
    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
      logger.info('✅ Team Knowledge Database connected successfully');
    } finally {
      client.release();
    }
  }

  // =====================================================
  // TEAM MEMBER OPERATIONS
  // =====================================================

  async findTeamMemberByName(searchName: string): Promise<RecognitionResult> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM find_team_member_by_name($1)
      `;

      const result = await client.query(query, [searchName]);

      if (result.rows.length === 0) {
        return {
          member_found: false,
          confidence: 0,
          match_type: 'fuzzy_match',
          related_members: [],
          context: {
            recent_mentions: 0,
            user_interactions: 0,
            relationship_context: [],
          },
        };
      }

      const bestMatch = result.rows[0];
      const teamMember = await this.getTeamMemberById(bestMatch.member_id);

      // Get related members
      const relatedMembers = await this.getRelatedMembers(bestMatch.member_id);

      // Get context
      const context = await this.getMemberContext(bestMatch.member_id);

      return {
        member_found: true,
        member: teamMember,
        confidence: parseFloat(bestMatch.confidence),
        match_type: bestMatch.match_type,
        related_members: relatedMembers,
        context,
      };
    } finally {
      client.release();
    }
  }

  async getTeamMemberById(memberId: string): Promise<TeamMember> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT
          id, name, role, email, pin, department, bio,
          name_variations, role_keywords, expertise_areas,
          reports_to, manages, collaborates_with,
          availability_status, verification_status, confidence_score,
          last_updated, created_at
        FROM team_members
        WHERE id = $1
      `;

      const result = await client.query(query, [memberId]);

      if (result.rows.length === 0) {
        throw new Error(`Team member not found: ${memberId}`);
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        role: row.role,
        email: row.email,
        pin: row.pin,
        department: row.department,
        bio: row.bio,
        name_variations: row.name_variations || [],
        role_keywords: row.role_keywords || [],
        expertise_areas: row.expertise_areas || [],
        reports_to: row.reports_to,
        manages: row.manages || [],
        collaborates_with: row.collaborates_with || [],
        availability_status: row.availability_status,
        verification_status: row.verification_status,
        confidence_score: parseFloat(row.confidence_score),
        last_updated: row.last_updated,
        created_at: row.created_at,
      };
    } finally {
      client.release();
    }
  }

  async getAllTeamMembers(): Promise<TeamMember[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT
          id, name, role, email, pin, department, bio,
          name_variations, role_keywords, expertise_areas,
          reports_to, manages, collaborates_with,
          availability_status, verification_status, confidence_score,
          last_updated, created_at
        FROM team_members
        ORDER BY department, name
      `;

      const result = await client.query(query);

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        email: row.email,
        pin: row.pin,
        department: row.department,
        bio: row.bio,
        name_variations: row.name_variations || [],
        role_keywords: row.role_keywords || [],
        expertise_areas: row.expertise_areas || [],
        reports_to: row.reports_to,
        manages: row.manages || [],
        collaborates_with: row.collaborates_with || [],
        availability_status: row.availability_status,
        verification_status: row.verification_status,
        confidence_score: parseFloat(row.confidence_score),
        last_updated: row.last_updated,
        created_at: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  async getTeamMembersByDepartment(department: string): Promise<TeamMember[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT
          id, name, role, email, pin, department, bio,
          name_variations, role_keywords, expertise_areas,
          reports_to, manages, collaborates_with,
          availability_status, verification_status, confidence_score,
          last_updated, created_at
        FROM team_members
        WHERE department = $1
        ORDER BY name
      `;

      const result = await client.query(query, [department]);

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        email: row.email,
        pin: row.pin,
        department: row.department,
        bio: row.bio,
        name_variations: row.name_variations || [],
        role_keywords: row.role_keywords || [],
        expertise_areas: row.expertise_areas || [],
        reports_to: row.reports_to,
        manages: row.manages || [],
        collaborates_with: row.collaborates_with || [],
        availability_status: row.availability_status,
        verification_status: row.verification_status,
        confidence_score: parseFloat(row.confidence_score),
        last_updated: row.last_updated,
        created_at: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  // =====================================================
  // RELATIONSHIP OPERATIONS
  // =====================================================

  async getRelatedMembers(memberId: string): Promise<TeamMember[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT DISTINCT tm.*
        FROM team_members tm
        JOIN team_relationships tr ON (
          (tr.member_a = $1 AND tr.member_b = tm.id) OR
          (tr.member_b = $1 AND tr.member_a = tm.id)
        )
        WHERE tm.id != $1
        ORDER BY tr.relationship_strength DESC, tm.name
      `;

      const result = await client.query(query, [memberId]);

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        email: row.email,
        pin: row.pin,
        department: row.department,
        bio: row.bio,
        name_variations: row.name_variations || [],
        role_keywords: row.role_keywords || [],
        expertise_areas: row.expertise_areas || [],
        reports_to: row.reports_to,
        manages: row.manages || [],
        collaborates_with: row.collaborates_with || [],
        availability_status: row.availability_status,
        verification_status: row.verification_status,
        confidence_score: parseFloat(row.confidence_score),
        last_updated: row.last_updated,
        created_at: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  async getTeamRelationships(memberId?: string): Promise<TeamRelationship[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT
          id, member_a, member_b, relationship_type, relationship_strength,
          interaction_frequency, projects_together, confidence_level, last_interaction
        FROM team_relationships
      `;

      const params: any[] = [];

      if (memberId) {
        query += ` WHERE (member_a = $1 OR member_b = $1)`;
        params.push(memberId);
      }

      query += ` ORDER BY relationship_strength DESC`;

      const result = await client.query(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        member_a: row.member_a,
        member_b: row.member_b,
        relationship_type: row.relationship_type,
        relationship_strength: parseFloat(row.relationship_strength),
        interaction_frequency: row.interaction_frequency,
        projects_together: row.projects_together || [],
        confidence_level: parseFloat(row.confidence_level),
        last_interaction: row.last_interaction,
      }));
    } finally {
      client.release();
    }
  }

  // =====================================================
  // COLLECTIVE MEMORY OPERATIONS
  // =====================================================

  async getMemberContext(memberId: string): Promise<{
    recent_mentions: number;
    user_interactions: number;
    relationship_context: string[];
  }> {
    const client = await this.pool.connect();
    try {
      // Get recent mentions count
      const mentionsQuery = `
        SELECT COUNT(*) as count
        FROM team_interactions
        WHERE primary_member_mentioned = $1
        AND created_at > NOW() - INTERVAL '30 days'
      `;

      const mentionsResult = await client.query(mentionsQuery, [memberId]);
      const recentMentions = parseInt(mentionsResult.rows[0].count);

      // Get user interactions count
      const interactionsQuery = `
        SELECT COUNT(DISTINCT user_id) as count
        FROM team_interactions
        WHERE primary_member_mentioned = $1
      `;

      const interactionsResult = await client.query(interactionsQuery, [memberId]);
      const userInteractions = parseInt(interactionsResult.rows[0].count);

      // Get relationship context
      const relationshipsQuery = `
        SELECT
          tm.name as related_name,
          tr.relationship_type,
          tr.interaction_frequency
        FROM team_relationships tr
        JOIN team_members tm ON (tr.member_b = tm.id)
        WHERE tr.member_a = $1 AND tr.confidence_level > 0.7
        LIMIT 5
      `;

      const relationshipsResult = await client.query(relationshipsQuery, [memberId]);
      const relationshipContext = relationshipsResult.rows.map(
        (row) => `${row.related_name} (${row.relationship_type}, ${row.interaction_frequency})`
      );

      return {
        recent_mentions: recentMentions,
        user_interactions: userInteractions,
        relationship_context: relationshipContext,
      };
    } finally {
      client.release();
    }
  }

  async recordTeamInteraction(
    interaction: Omit<TeamInteraction, 'id' | 'created_at'>
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO team_interactions (
          session_id, user_id, primary_member_mentioned, secondary_members_mentioned,
          interaction_type, interaction_sentiment, original_query,
          member_recognition_success, recognition_confidence,
          business_context, user_intent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      await client.query(query, [
        interaction.session_id,
        interaction.user_id,
        interaction.primary_member_mentioned,
        interaction.secondary_members_mentioned,
        interaction.interaction_type,
        interaction.interaction_sentiment,
        interaction.original_query,
        interaction.member_recognition_success,
        interaction.recognition_confidence,
        JSON.stringify(interaction.business_context),
        JSON.stringify(interaction.user_intent),
      ]);

      // Update confidence score if recognition was successful
      if (interaction.member_recognition_success && interaction.recognition_confidence > 0.8) {
        await this.updateMemberConfidence(interaction.primary_member_mentioned!, 0.01);
      }
    } finally {
      client.release();
    }
  }

  async recordCollectiveMemory(memory: Omit<CollectiveMemory, 'id' | 'created_at'>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO collective_memory (
          session_id, user_id, query_text, response_text, query_type,
          team_members_mentioned, topics_discussed, response_quality_score,
          user_satisfaction_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await client.query(query, [
        memory.session_id,
        memory.user_id,
        memory.query_text,
        memory.response_text,
        memory.query_type,
        memory.team_members_mentioned,
        memory.topics_discussed,
        memory.response_quality_score,
        memory.user_satisfaction_rating,
      ]);
    } finally {
      client.release();
    }
  }

  private async updateMemberConfidence(memberId: string, increment: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE team_members
        SET confidence_score = LEAST(confidence_score + $1, 1.0),
            last_updated = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await client.query(query, [increment, memberId]);
    } finally {
      client.release();
    }
  }

  // =====================================================
  // SEARCH AND DISCOVERY
  // =====================================================

  async searchTeamMembers(searchTerm: string, limit: number = 10): Promise<TeamMember[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT
          id, name, role, email, pin, department, bio,
          name_variations, role_keywords, expertise_areas,
          reports_to, manages, collaborates_with,
          availability_status, verification_status, confidence_score,
          last_updated, created_at,
          ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
        FROM team_members
        WHERE search_vector @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC, confidence_score DESC
        LIMIT $2
      `;

      const result = await client.query(query, [searchTerm, limit]);

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        email: row.email,
        pin: row.pin,
        department: row.department,
        bio: row.bio,
        name_variations: row.name_variations || [],
        role_keywords: row.role_keywords || [],
        expertise_areas: row.expertise_areas || [],
        reports_to: row.reports_to,
        manages: row.manages || [],
        collaborates_with: row.collaborates_with || [],
        availability_status: row.availability_status,
        verification_status: row.verification_status,
        confidence_score: parseFloat(row.confidence_score),
        last_updated: row.last_updated,
        created_at: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  async getTeamStatistics(): Promise<{
    total_members: number;
    departments: { [key: string]: number };
    verification_status: { verified: number; pending: number; unverified: number };
    average_confidence: number;
  }> {
    const client = await this.pool.connect();
    try {
      // Total members
      const totalQuery = `SELECT COUNT(*) as count FROM team_members`;
      const totalResult = await client.query(totalQuery);
      const totalMembers = parseInt(totalResult.rows[0].count);

      // Departments
      const deptQuery = `
        SELECT department, COUNT(*) as count
        FROM team_members
        GROUP BY department
      `;
      const deptResult = await client.query(deptQuery);
      const departments: { [key: string]: number } = {};
      deptResult.rows.forEach((row) => {
        departments[row.department] = parseInt(row.count);
      });

      // Verification status
      const verifyQuery = `
        SELECT verification_status, COUNT(*) as count
        FROM team_members
        GROUP BY verification_status
      `;
      const verifyResult = await client.query(verifyQuery);
      const verification_status = { verified: 0, pending: 0, unverified: 0 };
      verifyResult.rows.forEach((row) => {
        verification_status[row.verification_status as keyof typeof verification_status] = parseInt(
          row.count
        );
      });

      // Average confidence
      const confQuery = `SELECT AVG(confidence_score) as avg_confidence FROM team_members`;
      const confResult = await client.query(confQuery);
      const averageConfidence = parseFloat(confResult.rows[0].avg_confidence || 0);

      return {
        total_members: totalMembers,
        departments,
        verification_status,
        average_confidence: averageConfidence,
      };
    } finally {
      client.release();
    }
  }

  // =====================================================
  // CLEANUP
  // =====================================================

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// =====================================================
// PERSISTENT TEAM ENGINE
// =====================================================

export class PersistentTeamEngine {
  private database: TeamKnowledgeDatabase;

  constructor(connectionString: string) {
    this.database = new TeamKnowledgeDatabase(connectionString);
  }

  async initialize(): Promise<void> {
    await this.database.initialize();
  }

  async recognizeTeamMember(
    query: string,
    userId: string,
    sessionId: string
  ): Promise<PersistentMemory> {
    // Extract potential names from query
    const potentialNames = this.extractNamesFromQuery(query);

    let bestRecognition: RecognitionResult = {
      member_found: false,
      confidence: 0,
      match_type: 'fuzzy_match',
      related_members: [],
      context: {
        recent_mentions: 0,
        user_interactions: 0,
        relationship_context: [],
      },
    };

    // Try each potential name
    for (const name of potentialNames) {
      const recognition = await this.database.findTeamMemberByName(name);

      if (recognition.confidence > bestRecognition.confidence) {
        bestRecognition = recognition;
      }
    }

    // Record the interaction
    if (bestRecognition.member_found) {
      await this.database.recordTeamInteraction({
        session_id: sessionId,
        user_id: userId,
        primary_member_mentioned: bestRecognition.member?.id,
        secondary_members_mentioned: bestRecognition.related_members.map((m) => m.id),
        interaction_type: 'inquiry',
        original_query: query,
        member_recognition_success: true,
        recognition_confidence: bestRecognition.confidence,
        business_context: {},
        user_intent: {},
      });
    }

    // Get collective context
    const collectiveContext = await this.getCollectiveContext(userId, bestRecognition.member?.id);

    return {
      member_recognition: bestRecognition,
      collective_context: collectiveContext,
    };
  }

  async learnFromRAG(query: string, ragResult: any, userId: string): Promise<void> {
    // If RAG found good team information, learn from it
    if (ragResult.confidence > 0.8 && ragResult.entities) {
      for (const entity of ragResult.entities) {
        if (entity.type === 'person') {
          // Try to match with existing team members
          const recognition = await this.database.findTeamMemberByName(entity.name);

          if (!recognition.member_found) {
            // This might be a new team member or variation
            logger.info(`Potential new team member detected: ${entity.name}`);
          }
        }
      }
    }
  }

  private extractNamesFromQuery(query: string): string[] {
    // Simple name extraction - can be enhanced with NLP
    const words = query.split(/\s+/);
    const names: string[] = [];

    // Look for capitalized words that might be names
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w\s]/gi, '');

      if (word.length > 2 && /^[A-Z][a-z]/.test(word)) {
        names.push(word);

        // Check for two-word names
        if (i < words.length - 1) {
          const nextWord = words[i + 1].replace(/[^\w\s]/gi, '');
          if (nextWord.length > 2 && /^[A-Z][a-z]/.test(nextWord)) {
            names.push(`${word} ${nextWord}`);
          }
        }
      }
    }

    return [...new Set(names)]; // Remove duplicates
  }

  private async getCollectiveContext(
    userId: string,
    memberId?: string
  ): Promise<{
    recent_discussions: Array<{
      topic: string;
      date: Date;
      participants: string[];
    }>;
    user_history: Array<{
      query: string;
      response: string;
      date: Date;
      satisfaction?: number;
    }>;
    relationship_network: TeamRelationship[];
  }> {
    // Get recent discussions involving this member
    const recentDiscussions = memberId ? await this.getRecentDiscussionsForMember(memberId) : [];

    // Get user history
    const userHistory = await this.getUserHistory(userId);

    // Get relationship network
    const relationshipNetwork = memberId ? await this.database.getTeamRelationships(memberId) : [];

    return {
      recent_discussions: recentDiscussions,
      user_history: userHistory,
      relationship_network: relationshipNetwork,
    };
  }

  private async getRecentDiscussionsForMember(memberId: string): Promise<
    Array<{
      topic: string;
      date: Date;
      participants: string[];
    }>
  > {
    const client = await this.database['pool'].connect();
    try {
      const query = `
        SELECT
          cm.topics_discussed,
          cm.created_at as date,
          cm.team_members_mentioned
        FROM collective_memory cm
        WHERE $1 = ANY(cm.team_members_mentioned)
        ORDER BY cm.created_at DESC
        LIMIT 5
      `;

      const result = await client.query(query, [memberId]);

      return result.rows.map((row) => ({
        topic: row.topics_discussed[0] || 'General discussion',
        date: row.date,
        participants: row.team_members_mentioned,
      }));
    } finally {
      client.release();
    }
  }

  private async getUserHistory(userId: string): Promise<
    Array<{
      query: string;
      response: string;
      date: Date;
      satisfaction?: number;
    }>
  > {
    const client = await this.database['pool'].connect();
    try {
      const query = `
        SELECT
          cm.query_text,
          cm.response_text,
          cm.created_at as date,
          cm.user_satisfaction_rating
        FROM collective_memory cm
        WHERE cm.user_id = $1
        ORDER BY cm.created_at DESC
        LIMIT 10
      `;

      const result = await client.query(query, [userId]);

      return result.rows.map((row) => ({
        query: row.query_text,
        response: row.response_text,
        date: row.date,
        satisfaction: row.user_satisfaction_rating,
      }));
    } finally {
      client.release();
    }
  }

  async getTeamMemberByName(name: string): Promise<TeamMember | null> {
    const recognition = await this.database.findTeamMemberByName(name);
    return recognition.member_found ? recognition.member! : null;
  }

  async getAllTeamMembers(): Promise<TeamMember[]> {
    return await this.database.getAllTeamMembers();
  }

  async getTeamStatistics() {
    return await this.database.getTeamStatistics();
  }

  async close(): Promise<void> {
    await this.database.close();
  }
}

export default PersistentTeamEngine;
