import { Router } from 'express';
import { EnhancedTeamHandler } from './EnhancedTeamHandler';

// =====================================================
// TEAM PERSISTENT KNOWLEDGE API ROUTES
// =====================================================

export function createPersistentTeamRoutes(teamHandler: EnhancedTeamHandler): Router {
  const router = Router();

  // POST /api/team/persistent/recognize
  // Main endpoint for team member recognition with persistent knowledge
  router.post('/recognize', async (req, res) => {
    await teamHandler.handleTeamRecognition(req, res);
  });

  // GET /api/team/persistent/list
  // Get all team members or filter by department
  router.get('/list', async (req, res) => {
    await teamHandler.handleTeamList(req, res);
  });

  // GET /api/team/persistent/search
  // Search team members by name, role, or expertise
  router.get('/search', async (req, res) => {
    await teamHandler.handleTeamSearch(req, res);
  });

  // GET /api/team/persistent/statistics
  // Get team statistics and metrics
  router.get('/statistics', async (req, res) => {
    await teamHandler.handleTeamStatistics(req, res);
  });

  // POST /api/team/persistent/feedback
  // Record user feedback for continuous learning
  router.post('/feedback', async (req, res) => {
    await teamHandler.recordFeedback(req, res);
  });

  return router;
}

// =====================================================
// MIDDLEWARE FOR TEAM CONTEXT
// =====================================================

export function addTeamContext(req: Request, res: Response, next: Function) {
  // Add team context to request for use in handlers
  req.teamContext = {
    timestamp: new Date().toISOString(),
    session_id: req.headers['x-session-id'] as string || `session_${Date.now()}`,
    user_id: req.headers['x-user-id'] as string || 'anonymous',
    source: req.headers['x-source'] as string || 'api'
  };

  next();
}

// =====================================================
// VALIDATION MIDDLEWARE
// =====================================================

export function validateTeamRequest(req: Request, res: Response, next: Function) {
  const { query, user_id, session_id } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Query parameter is required and must be a string'
    });
  }

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'User ID parameter is required and must be a string'
    });
  }

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Session ID parameter is required and must be a string'
    });
  }

  // Length validations
  if (query.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Query length cannot exceed 1000 characters'
    });
  }

  if (user_id.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'User ID length cannot exceed 100 characters'
    });
  }

  next();
}

// =====================================================
// ENHANCED ENDPOINT EXAMPLES
// =====================================================

/*
EXAMPLE REQUESTS:

1. Team Member Recognition:
POST /api/team/persistent/recognize
{
  "query": "Chi è Zainal Abidin e qual è il suo ruolo?",
  "user_id": "user123",
  "session_id": "session456",
  "context": {
    "language": "it",
    "formality": "formal"
  }
}

RESPONSE:
{
  "success": true,
  "data": {
    "response": "✅ **Zainal Abidin** - CEO\n\n🏢 **Dipartimento**: Management\n\n📋 **Informazioni Professionali**:\n• **Ruolo**: CEO, Chief Executive, Direttore, Presidente\n• **Aree di competenza**: business strategy, management, leadership, corporate governance\n• **Stato**: ✅ Verificato\n• **Disponibilità**: 🟢 Online\n\n📧 **Contatti**:\n• Email: zainal@balizero.com\n\n*Per contattare direttamente Zainal Abidin, puoi scrivere all'email indicata.*",
    "confidence": 1.0,
    "member_found": true,
    "member_info": {
      "id": "uuid-here",
      "name": "Zainal Abidin",
      "role": "CEO",
      "department": "management",
      "email": "zainal@balizero.com"
    },
    "context": {
      "recent_discussions": [...],
      "user_history": [...],
      "relationship_network": [...]
    },
    "related_members": [...],
    "learning_applied": true
  }
}

2. Team List:
GET /api/team/persistent/list?department=tax_department

RESPONSE:
{
  "success": true,
  "data": {
    "team_members": [
      {
        "id": "uuid-1",
        "name": "Veronika",
        "role": "Tax Manager",
        "department": "tax_department",
        "email": "tax@balizero.com",
        "availability_status": "online",
        "confidence_score": 1.0
      },
      ...
    ],
    "total_count": 5,
    "department": "tax_department"
  }
}

3. Team Search:
GET /api/team/persistent/search?q=tax&limit=5

RESPONSE:
{
  "success": true,
  "data": {
    "search_term": "tax",
    "results": [
      {
        "id": "uuid-1",
        "name": "Veronika",
        "role": "Tax Manager",
        "department": "tax_department",
        "email": "tax@balizero.com",
        "expertise_areas": ["tax management", "tax planning", "corporate taxation", "tax compliance"],
        "confidence_score": 1.0
      },
      ...
    ],
    "total_found": 5
  }
}

4. Team Statistics:
GET /api/team/persistent/statistics

RESPONSE:
{
  "success": true,
  "data": {
    "total_members": 23,
    "departments": {
      "management": 3,
      "tech": 1,
      "setup_team": 10,
      "tax_department": 5,
      "marketing": 2,
      "reception": 1,
      "advisory": 1
    },
    "verification_status": {
      "verified": 23,
      "pending": 0,
      "unverified": 0
    },
    "average_confidence": 1.0
  }
}

5. Feedback Recording:
POST /api/team/persistent/feedback
{
  "session_id": "session456",
  "user_id": "user123",
  "query": "Chi è Zainal Abidin?",
  "response": "Zainal Abidin è il CEO di Bali Zero...",
  "rating": 5,
  "feedback": "Response was very accurate and helpful"
}

RESPONSE:
{
  "success": true,
  "message": "Feedback recorded successfully"
}
*/