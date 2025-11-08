import { Request, Response } from 'express';
import { PersistentTeamEngine, PersistentMemory } from './TeamKnowledgeEngine';
import logger from '../logger.js';

// =====================================================
// ENHANCED TEAM HANDLER WITH PERSISTENT KNOWLEDGE
// =====================================================

export interface TeamQuery {
  text: string;
  user_id: string;
  session_id: string;
  context?: any;
}

export interface TeamResponse {
  success: boolean;
  response: string;
  confidence: number;
  member_found?: boolean;
  member_info?: any;
  context?: any;
  related_members?: any[];
  learning_applied?: boolean;
}

export class EnhancedTeamHandler {
  private persistentEngine: PersistentTeamEngine;
  private fallbackHandler: any; // Existing RAG handler

  constructor(connectionString: string, fallbackHandler?: any) {
    this.persistentEngine = new PersistentTeamEngine(connectionString);
    this.fallbackHandler = fallbackHandler;
  }

  async initialize(): Promise<void> {
    await this.persistentEngine.initialize();
    logger.info('✅ Enhanced Team Handler initialized with persistent knowledge');
  }

  // =====================================================
  // MAIN QUERY HANDLER
  // =====================================================

  async handleQuery(query: TeamQuery): Promise<TeamResponse> {
    try {
      // 1. Try persistent recognition first
      const persistentResult = await this.persistentEngine.recognizeTeamMember(
        query.text,
        query.user_id,
        query.session_id
      );

      if (persistentResult.member_recognition.member_found) {
        return this.buildPersistentResponse(persistentResult, query);
      }

      // 2. Fallback to existing RAG system
      if (this.fallbackHandler) {
        const ragResult = await this.fallbackHandler.query(query.text);

        // 3. Learn from successful RAG results
        if (ragResult.confidence > 0.8) {
          await this.persistentEngine.learnFromRAG(query.text, ragResult, query.user_id);
        }

        return this.buildRAGResponse(ragResult, query);
      }

      // 4. Generic team response
      return this.buildGenericResponse(query);
    } catch (error) {
      logger.error('Enhanced Team Handler error:', error);
      return {
        success: false,
        response:
          "Mi dispiace, ho riscontrato un problema nell'elaborare la tua richiesta sul team.",
        confidence: 0,
      };
    }
  }

  // =====================================================
  // RESPONSE BUILDERS
  // =====================================================

  private buildPersistentResponse(
    persistentResult: PersistentMemory,
    _query: TeamQuery
  ): TeamResponse {
    const { member_recognition, collective_context } = persistentResult;

    if (!member_recognition.member) {
      return {
        success: false,
        response: 'Non ho trovato informazioni sul membro del team richiesto.',
        confidence: 0,
        member_found: false,
      };
    }

    const member = member_recognition.member;
    let response = '';

    // Build contextual response based on match type and context
    response = this.buildTeamMemberIntroduction(member, member_recognition.match_type);

    // Add professional information
    response += this.buildProfessionalInfo(member);

    // Add contextual information if available
    if (collective_context.recent_discussions.length > 0) {
      response += this.buildRecentContext(collective_context.recent_discussions);
    }

    // Add relationship context
    if (member_recognition.context.relationship_context.length > 0) {
      response += this.buildRelationshipContext(member_recognition.context.relationship_context);
    }

    // Add related team members if relevant
    if (member_recognition.related_members.length > 0) {
      response += this.buildRelatedTeamMembers(member_recognition.related_members);
    }

    // Add contact information
    if (member.email) {
      response += this.buildContactInfo(member);
    }

    return {
      success: true,
      response,
      confidence: member_recognition.confidence,
      member_found: true,
      member_info: member,
      context: collective_context,
      related_members: member_recognition.related_members,
      learning_applied: true,
    };
  }

  private buildTeamMemberIntroduction(member: any, matchType: string): string {
    let intro = '';

    switch (matchType) {
      case 'exact_match':
        intro = `✅ **${member.name}** - ${member.role}\n\n`;
        break;
      case 'variation_match':
        intro = `✅ **${member.name}** - ${member.role}\n\n`;
        break;
      case 'partial_match':
        intro = `✅ **${member.name}** - ${member.role}\n\n`;
        break;
      default:
        intro = `✅ **${member.name}** - ${member.role}\n\n`;
    }

    // Add department information
    intro += `🏢 **Dipartimento**: ${this.translateDepartment(member.department)}\n`;

    return intro;
  }

  private buildProfessionalInfo(member: any): string {
    let info = '\n📋 **Informazioni Professionali**:\n';

    // Role details
    if (member.role_keywords && member.role_keywords.length > 0) {
      info += `• **Ruolo**: ${member.role_keywords.join(', ')}\n`;
    }

    // Expertise areas
    if (member.expertise_areas && member.expertise_areas.length > 0) {
      info += `• **Aree di competenza**: ${member.expertise_areas.join(', ')}\n`;
    }

    // Status
    info += `• **Stato**: ${member.verification_status === 'verified' ? '✅ Verificato' : '🔄 In verifica'}\n`;
    info += `• **Disponibilità**: ${this.translateAvailability(member.availability_status)}\n`;

    return info;
  }

  private buildRecentContext(recentDiscussions: any[]): string {
    let context = '\n📅 **Attività Recente**:\n';

    recentDiscussions.slice(0, 3).forEach((discussion, _index) => {
      const date = new Date(discussion.date).toLocaleDateString('it-IT');
      context += `• ${discussion.topic} (${date})\n`;
    });

    return context;
  }

  private buildRelationshipContext(relationships: string[]): string {
    let context = '\n🤝 **Relazioni Team**:\n';

    relationships.slice(0, 3).forEach((rel) => {
      context += `• ${rel}\n`;
    });

    return context;
  }

  private buildRelatedTeamMembers(relatedMembers: any[]): string {
    let related = '\n👥 **Collaboratori Principali**:\n';

    relatedMembers.slice(0, 3).forEach((member) => {
      related += `• ${member.name} - ${member.role}\n`;
    });

    return related;
  }

  private buildContactInfo(member: any): string {
    let contact = '\n📧 **Contatti**:\n';

    if (member.email) {
      contact += `• Email: ${member.email}\n`;
    }

    contact +=
      "\n*Per contattare direttamente ${member.name}, puoi scrivere all'email indicata.*\n";

    return contact;
  }

  private buildRAGResponse(ragResult: any, _query: TeamQuery): TeamResponse {
    let response = ragResult.response || '';

    // Add learning notification if confidence is high
    if (ragResult.confidence > 0.8) {
      response += '\n\n🧠 *Sto imparando da questa interazione per migliorare le risposte future.*';
    }

    return {
      success: true,
      response,
      confidence: ragResult.confidence || 0.5,
      member_found: ragResult.member_found || false,
      learning_applied: ragResult.confidence > 0.8,
    };
  }

  private buildGenericResponse(_query: TeamQuery): TeamResponse {
    const response = `👋 **Team Bali Zero**

Non ho trovato informazioni specifiche sulla tua richiesta, ma ecco come posso aiutarti:

🔍 **Posso trovarti informazioni su:**
• Membri specifici del team (nomi, ruoli, contatti)
• Dipartimenti (Management, Tech, Tax, Marketing, etc.)
• Competenze e aree di specializzazione

💡 **Prova a chiedere:**
• "Chi è il CEO di Bali Zero?"
• "Qual è l'email del reparto tax?"
• "Elencami i consulenti del team"
• "Chi si occupa di marketing?"

Il team Bali Zero è composto da 23 professionisti esperti pronti ad aiutarti!`;

    return {
      success: true,
      response,
      confidence: 0.3,
      member_found: false,
    };
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private translateDepartment(department: string): string {
    const translations: { [key: string]: string } = {
      management: 'Management',
      tech: 'Tecnologia',
      setup_team: 'Team Setup',
      tax_department: 'Dipartimento Tax',
      marketing: 'Marketing',
      reception: 'Reception',
      advisory: 'Consulenza Esterna',
    };

    return translations[department] || department;
  }

  private translateAvailability(status: string): string {
    const translations: { [key: string]: string } = {
      online: '🟢 Online',
      offline: '⚪ Offline',
      busy: '🟡 Occupato',
    };

    return translations[status] || status;
  }

  // =====================================================
  // API ENDPOINTS
  // =====================================================

  async handleTeamRecognition(req: Request, res: Response): Promise<void> {
    try {
      const { query, user_id, session_id } = req.body;

      if (!query || !user_id || !session_id) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: query, user_id, session_id',
        });
        return;
      }

      const result = await this.handleQuery({
        text: query,
        user_id,
        session_id,
        context: req.body.context,
      });

      res.json({
        success: result.success,
        data: {
          response: result.response,
          confidence: result.confidence,
          member_found: result.member_found,
          member_info: result.member_info,
          context: result.context,
          related_members: result.related_members,
          learning_applied: result.learning_applied,
        },
      });
    } catch (error) {
      logger.error('Team recognition error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during team recognition',
      });
    }
  }

  async handleTeamList(req: Request, res: Response): Promise<void> {
    try {
      const { department } = req.query;

      let teamMembers;
      if (department) {
        teamMembers = await this.persistentEngine['database'].getTeamMembersByDepartment(
          department as string
        );
      } else {
        teamMembers = await this.persistentEngine.getAllTeamMembers();
      }

      const formattedMembers = teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        department: member.department,
        email: member.email,
        availability_status: member.availability_status,
        confidence_score: member.confidence_score,
      }));

      res.json({
        success: true,
        data: {
          team_members: formattedMembers,
          total_count: formattedMembers.length,
          department: department || 'all',
        },
      });
    } catch (error) {
      logger.error('Team list error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during team list retrieval',
      });
    }
  }

  async handleTeamSearch(req: Request, res: Response): Promise<void> {
    try {
      const { q: searchTerm, limit = 10 } = req.query;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          error: 'Missing search term parameter: q',
        });
        return;
      }

      const teamMembers = await this.persistentEngine['database'].searchTeamMembers(
        searchTerm as string,
        parseInt(limit as string)
      );

      const formattedMembers = teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        department: member.department,
        email: member.email,
        expertise_areas: member.expertise_areas,
        confidence_score: member.confidence_score,
      }));

      res.json({
        success: true,
        data: {
          search_term: searchTerm,
          results: formattedMembers,
          total_found: formattedMembers.length,
        },
      });
    } catch (error) {
      logger.error('Team search error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during team search',
      });
    }
  }

  async handleTeamStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.persistentEngine.getTeamStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Team statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during statistics retrieval',
      });
    }
  }

  // =====================================================
  // LEARNING AND IMPROVEMENT
  // =====================================================

  async recordFeedback(req: Request, res: Response): Promise<void> {
    try {

      const { session_id, user_id, query, response, rating, _feedback } = req.body;

      if (!session_id || !user_id || !query || !response || rating === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters',
        });
        return;
      }

      // Record the feedback in collective memory
      await this.persistentEngine['database'].recordCollectiveMemory({
        session_id,
        user_id,
        query_text: query,
        response_text: response,
        query_type: 'team_inquiry',
        team_members_mentioned: [],
        topics_discussed: [],
        user_satisfaction_rating: rating,
      });

      res.json({
        success: true,
        message: 'Feedback recorded successfully',
      });
    } catch (error) {
      logger.error('Feedback recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during feedback recording',
      });
    }
  }

  // =====================================================
  // CLEANUP
  // =====================================================

  async close(): Promise<void> {
    await this.persistentEngine.close();
  }
}

export default EnhancedTeamHandler;
