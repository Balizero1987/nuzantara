# 🚀 ZANTARA Team Features Setup Guide

**Complete guide to Team Dashboard, AI Agents, Zero Tools Security, and Decision Logging**

---

## 📋 Table of Contents

1. [Team Dashboard Setup](#1-team-dashboard-setup)
2. [Zero Tools Security Configuration](#2-zero-tools-security-configuration)
3. [Decision Logging System](#3-decision-logging-system)
4. [AI Agents Integration](#4-ai-agents-integration)
5. [Quick Start Commands](#5-quick-start-commands)
6. [Troubleshooting](#6-troubleshooting)

---

## 1️⃣ Team Dashboard Setup

### 📂 Files Created

```
apps/webapp/team/
├── team-dashboard.html      # Main dashboard UI
├── team-dashboard.js        # Dashboard logic
├── team-dashboard.css       # Styling
└── templates/
    └── decision-templates.json  # Decision templates
```

### 🔧 Installation

1. **No installation needed!** Files are ready to use.

2. **Access the dashboard**:
   ```
   https://zantara.balizero.com/team/team-dashboard.html
   ```

3. **Or run locally**:
   ```bash
   cd apps/webapp
   python3 -m http.server 8080
   # Visit: http://localhost:8080/team/team-dashboard.html
   ```

### ✨ Features Available

| Feature | Status | Description |
|---------|--------|-------------|
| **Overview** | ✅ Ready | Team stats, activity feed, alerts |
| **AI Agents** | ✅ Ready | Monitor all 10 AI agents status |
| **Team Members** | ✅ Ready | Team profiles, skills, metrics |
| **Decision Log** | ✅ Ready | Log and track important decisions |
| **Analytics** | ✅ Ready | Charts for commits, quality, velocity |
| **Team Memory** | 🚧 Partial | Semantic search (needs backend integration) |
| **Security Audit** | ✅ Ready | Zero Tools audit log viewer |

### 🎯 Quick Tour

#### Overview Section
```javascript
// Automatic refresh every 30 seconds
// Shows:
- Commits today
- Deploys count
- Open issues
- Sprint progress
- Recent activity feed
- System alerts
```

#### AI Agents Section
```javascript
// Monitors 10 agents:
1. Journey Orchestrator (guides clients)
2. Compliance Monitor (deadline alerts)
3. Knowledge Graph Builder (entity mapping)
4. Auto Ingestion (document updates)
5. Cross-Oracle Synthesis (multi-KB search)
6. Dynamic Pricing (quote generation)
7. Autonomous Research (deep research)
8. Client Insights (analytics)
9. Revenue Forecast (projections)
10. Team Performance (productivity metrics)
```

#### Team Members Section
```javascript
// Shows for each member:
- Name, role, avatar
- Skills/expertise tags
- Commits count
- PRs merged
- Quality rating
- Search and filter capabilities
```

#### Decision Log
```javascript
// Log decisions with:
- Type (architecture, technical, business, etc.)
- Title and description
- Participants and decision maker
- Impact level
- Review date
- Full timeline view
```

### 🔐 Authentication

Dashboard requires authentication. Uses same auth system as main webapp:

```javascript
// Auto-checks for:
localStorage.getItem('zantara-token')

// If not authenticated → redirects to login
```

---

## 2️⃣ Zero Tools Security Configuration

### 📂 Files Created

```
apps/backend-ts/src/
├── services/
│   └── zero-tools-security.ts     # Security service
└── handlers/team/
    └── security-audit.ts          # Security API handlers
```

### 🔒 Security Layers Implemented

#### Layer 1: User Authentication
```typescript
// Only userId='zero' can use Zero Tools
validateUser(userId: string): SecurityValidation

// Usage:
const validation = zeroToolsSecurity.validateUser(userId);
if (!validation.allowed) {
  throw new Error(validation.reason);
}
```

#### Layer 2: File Path Protection
```typescript
// Protected files (cannot edit):
- .env
- .env.production
- service-account.json
- credentials.json
- secrets.yaml
- firebase-adminsdk.json

// Protected paths (cannot access):
- /etc
- /root
- /sys
- ~/.ssh

// Usage:
const validation = zeroToolsSecurity.validateFilePath(filePath);
```

#### Layer 3: Command Validation
```typescript
// Blocked dangerous commands:
- rm -rf
- sudo
- chmod 777
- > /dev/sda
- kill -9
- reboot
- shutdown

// Usage:
const validation = zeroToolsSecurity.validateBashCommand(command);
```

#### Layer 4: Environment Separation
```typescript
// Three environments with different policies:

DEV:
  - Auto-deploy allowed
  - Low risk
  - No approval needed

STAGING:
  - Auto-deploy allowed
  - Medium risk
  - No approval needed

PRODUCTION:
  - Manual approval required ⚠️
  - High risk
  - Approval token needed
```

#### Layer 5: Audit Logging
```typescript
// Every Zero Tool action is logged:
{
  timestamp: Date,
  userId: string,
  tool: string,
  action: string,
  params: any,
  result: 'success' | 'error' | 'blocked',
  environment: Environment
}

// Logs kept for 30 days
// Critical actions trigger Slack alerts
```

### 🚀 Production Deployment Workflow

**Standard deployment (dev/staging)**:
```bash
# No approval needed
POST /call
{
  "key": "zero.tools.deploy_backend",
  "params": {
    "environment": "staging"
  }
}
```

**Production deployment (requires approval)**:
```bash
# Step 1: Request approval
POST /call
{
  "key": "security.deployment.request-approval",
  "params": {
    "userId": "zero",
    "environment": "production",
    "reason": "Deploy v2.3.6 with critical bug fix"
  }
}

# Response:
{
  "ok": true,
  "approvalToken": "approval_production_zero_1234567890",
  "expiresIn": 3600  # 1 hour
}

# Step 2: Deploy with token
POST /call
{
  "key": "zero.tools.deploy_backend",
  "params": {
    "environment": "production",
    "approvalToken": "approval_production_zero_1234567890"
  }
}
```

### 📊 Security API Endpoints

```typescript
// Get audit logs
POST /call
{
  "key": "security.audit.logs",
  "params": {
    "userId": "zero",        // optional filter
    "tool": "deploy_backend", // optional filter
    "result": "success",      // optional filter
    "limit": 100
  }
}

// Get security statistics
POST /call
{
  "key": "security.audit.stats",
  "params": {}
}

// Response:
{
  "ok": true,
  "stats": {
    "totalActions": 245,
    "blocked": 3,
    "errors": 12,
    "success": 230,
    "byTool": {
      "deploy_backend": 45,
      "edit_file": 89,
      "read_file": 111
    },
    "recentBlocked": [...]
  },
  "summary": {
    "successRate": 94,
    "blockedActions": 3
  }
}

// Get protected files list
POST /call
{
  "key": "security.protected-files",
  "params": {}
}

// Get blocked commands list
POST /call
{
  "key": "security.blocked-commands",
  "params": {}
}
```

### 🔔 Slack Alerts Setup (Optional)

Add to your environment:
```bash
# .env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Uncomment in `zero-tools-security.ts`:
```typescript
// Line 280 (approximately)
async sendSecurityAlert(entry: AuditLogEntry): Promise<void> {
  // Uncomment this block:
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Zero Tool Alert: ${entry.userId} used ${entry.tool} - ${entry.result}`,
      attachments: [{
        color: entry.result === 'blocked' ? 'danger' : 'warning',
        fields: [
          { title: 'Tool', value: entry.tool, short: true },
          { title: 'Result', value: entry.result, short: true },
          { title: 'Timestamp', value: entry.timestamp.toISOString() }
        ]
      }]
    })
  });
}
```

### 🧪 Testing Security

```bash
# Test 1: Validate user
curl -X POST https://nuzantara-orchestrator.fly.dev/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "zero.tools.read_file",
    "params": {
      "userId": "not_zero",  # Should be blocked!
      "path": "README.md"
    }
  }'

# Expected: { "ok": false, "error": "Unauthorized: Zero tools available only for userId=zero" }

# Test 2: Try to edit protected file
curl -X POST https://nuzantara-orchestrator.fly.dev/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "zero.tools.edit_file",
    "params": {
      "userId": "zero",
      "path": ".env",  # Protected file!
      "old_string": "OLD",
      "new_string": "NEW"
    }
  }'

# Expected: { "ok": false, "error": "File .env is protected and cannot be modified" }

# Test 3: Try dangerous command
curl -X POST https://nuzantara-orchestrator.fly.dev/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "zero.tools.bash",
    "params": {
      "userId": "zero",
      "command": "sudo rm -rf /"  # Blocked!
    }
  }'

# Expected: { "ok": false, "error": "Dangerous command not allowed" }
```

---

## 3️⃣ Decision Logging System

### 📂 Files Created

```
apps/backend-ts/src/handlers/team/
└── decision-log.ts              # Decision logging handlers

apps/webapp/team/templates/
└── decision-templates.json       # Decision templates
```

### 📝 How to Log a Decision

#### Via API
```bash
POST /call
{
  "key": "decision.save",
  "params": {
    "type": "architecture",
    "title": "Switch to GraphQL for new APIs",
    "description": "All new APIs will use GraphQL instead of REST",
    "rationale": "Better flexibility, reduces over-fetching, better docs",
    "participants": ["Marco", "Sara", "Zero"],
    "decidedBy": "Zero",
    "impact": "high",
    "alternatives": [
      "Continue with REST",
      "Use gRPC",
      "Hybrid REST + GraphQL"
    ],
    "consequences": [
      "Team needs to learn GraphQL",
      "Better frontend DX"
    ],
    "reviewDate": "2025-05-01",
    "tags": ["api", "architecture", "graphql"]
  }
}
```

#### Via Dashboard
1. Go to **Decision Log** section
2. Click **+ New Decision**
3. Select decision type
4. Fill form (use templates as guide)
5. Click **Save Decision**

### 📚 Decision Templates

7 templates available (see `decision-templates.json`):

1. **Architecture** - Design and technical architecture decisions
2. **Technical** - Implementation technology choices
3. **Business** - Business strategy and operations
4. **Hiring** - Team hiring and expansion
5. **Process** - Workflow and process changes
6. **Security** - Security measures and policies
7. **Incident** - Incident response and resolutions

### 🔍 Search & Filter Decisions

```bash
# Get all decisions
POST /call
{ "key": "decision.list", "params": {} }

# Filter by type
POST /call
{
  "key": "decision.list",
  "params": {
    "type": "architecture",
    "limit": 10
  }
}

# Search by text
POST /call
{
  "key": "decision.search",
  "params": {
    "query": "graphql",
    "limit": 20
  }
}

# Get decisions needing review
POST /call
{
  "key": "decision.review-needed",
  "params": {}
}

# Get statistics
POST /call
{
  "key": "decision.stats",
  "params": {}
}

# Response example:
{
  "ok": true,
  "stats": {
    "total": 45,
    "byType": {
      "architecture": 12,
      "technical": 18,
      "business": 8,
      "hiring": 3,
      "security": 4
    },
    "byImpact": {
      "critical": 5,
      "high": 15,
      "medium": 20,
      "low": 5
    },
    "recentDecisions": [...],
    "criticalDecisions": [...]
  }
}
```

### 📅 Decision Review Workflow

```bash
# Set review date when creating decision
{
  "reviewDate": "2025-03-01"  # Decision should be reviewed on this date
}

# Get decisions needing review
POST /call
{ "key": "decision.review-needed", "params": {} }

# Update decision status after review
POST /call
{
  "key": "decision.update-status",
  "params": {
    "id": "decision_abc123",
    "status": "implemented"  # or "reversed" if decision changed
  }
}
```

### 🏷️ Best Practices

1. **Log decisions immediately** - Don't wait days
2. **Include dissenting opinions** - Document why alternatives were rejected
3. **Use specific details** - Include versions, metrics, dates
4. **Tag consistently** - Makes searching easier
5. **Set review dates** - For important decisions (quarterly review)
6. **Update status** - Mark as implemented or reversed
7. **Link related decisions** - Reference previous decisions
8. **Be honest about tradeoffs** - Document the downsides too

---

## 4️⃣ AI Agents Integration

### 🤖 10 AI Agents Available

All agents are **ready in the backend** at `https://nuzantara-rag.fly.dev`.

#### Agent 1: Journey Orchestrator
```bash
# Create client journey
POST /api/agents/journey/create
{
  "clientId": "mario_rossi",
  "serviceType": "PT_PMA",
  "steps": ["documents", "notary", "registration", "bank"]
}

# Get next steps
GET /api/agents/journey/{id}/next-steps
```

#### Agent 2: Compliance Monitor
```bash
# Get compliance alerts
GET /api/agents/compliance/alerts

# Example response:
{
  "ok": true,
  "alerts": [
    {
      "type": "deadline",
      "severity": "high",
      "message": "KITAS for Marco Rossi expires in 30 days",
      "dueDate": "2024-12-17",
      "action": "Start renewal process"
    }
  ]
}

# Track deadline
POST /api/agents/compliance/track
{
  "clientId": "mario_rossi",
  "deadline": "2024-12-17",
  "type": "KITAS_renewal",
  "reminders": [90, 30, 7]  # days before
}
```

#### Agents 3-10
All agents follow similar REST API patterns. See `/api/agents/status` for full list.

### 🔗 Dashboard Integration

Dashboard automatically polls agent status every 30 seconds:

```javascript
// In team-dashboard.js
async function loadAgentsStatus() {
  const response = await fetch(`${CONFIG.ragURL}/api/agents/status`);
  const data = await response.json();

  // Displays:
  // - Agent name and status (active/inactive)
  // - Tasks completed
  // - Success rate
  // - Average time per task
}
```

### 📊 Using Agents for Team (not clients)

Even without clients, agents are useful for **team operations**:

```javascript
// Example: Use Journey Orchestrator for onboarding
POST /api/agents/journey/create
{
  "journeyType": "team_onboarding",
  "newMember": "Anna Rossi",
  "role": "Frontend Developer",
  "steps": [
    "setup_git_access",
    "setup_development_environment",
    "read_documentation",
    "first_task_assignment",
    "code_review_training",
    "deploy_access_granted"
  ]
}

// Agent tracks progress automatically
// Sends reminders
// Marks steps complete
// Suggests next action
```

```javascript
// Example: Use Compliance Monitor for sprint deadlines
POST /api/agents/compliance/track
{
  "teamEvent": "sprint_end",
  "deadline": "2024-11-22",
  "type": "development_sprint",
  "items": [
    "Google Calendar integration (Sara)",
    "CRM backend (Marco)",
    "Security audit review (Zero)"
  ],
  "reminders": [7, 3, 1]  # days before deadline
}
```

---

## 5️⃣ Quick Start Commands

### Start Dashboard Locally
```bash
cd /home/user/nuzantara/apps/webapp
python3 -m http.server 8080
# Open: http://localhost:8080/team/team-dashboard.html
```

### Log Your First Decision
```bash
curl -X POST https://nuzantara-orchestrator.fly.dev/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "decision.save",
    "params": {
      "type": "technical",
      "title": "Setup team dashboard",
      "description": "Created team dashboard with AI agents monitoring and decision logging",
      "rationale": "Improve team visibility, track decisions, monitor productivity",
      "participants": ["Zero"],
      "decidedBy": "Zero",
      "impact": "high",
      "tags": ["dashboard", "tooling", "productivity"]
    }
  }'
```

### View Audit Logs
```bash
curl -X POST https://nuzantara-orchestrator.fly.dev/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "security.audit.logs",
    "params": {
      "limit": 10
    }
  }'
```

### Check Agent Status
```bash
curl https://nuzantara-rag.fly.dev/api/agents/status
```

### Get Compliance Alerts
```bash
curl https://nuzantara-rag.fly.dev/api/agents/compliance/alerts
```

---

## 6️⃣ Troubleshooting

### Dashboard not loading?
```bash
# Check if files exist
ls apps/webapp/team/
# Should show: team-dashboard.html, team-dashboard.js, team-dashboard.css

# Check for JavaScript errors
# Open browser console (F12)
# Look for errors in Console tab

# Check authentication
# Open browser console, run:
localStorage.getItem('zantara-token')
# Should return token, otherwise login first
```

### Zero Tools blocked?
```bash
# Check userId
# Only userId='zero' can use Zero Tools

# Check file protection
curl -X POST .../call \
  -d '{"key": "security.protected-files", "params": {}}'

# Check command blocking
curl -X POST .../call \
  -d '{"key": "security.blocked-commands", "params": {}}'

# View audit logs for blocked actions
curl -X POST .../call \
  -d '{"key": "security.audit.logs", "params": {"result": "blocked"}}'
```

### Agents not responding?
```bash
# Check backend health
curl https://nuzantara-rag.fly.dev/health

# Check agent status endpoint
curl https://nuzantara-rag.fly.dev/api/agents/status

# If 404 → agents not deployed yet
# If 500 → check backend logs
# If timeout → backend may be sleeping (Fly.io free tier)
```

### Decisions not saving?
```bash
# Check endpoint exists
curl -X POST .../call \
  -d '{"key": "decision.list", "params": {}}'

# Verify all required fields
# Required: type, title, description, decidedBy, impact

# Check decision templates for field requirements
cat apps/webapp/team/templates/decision-templates.json
```

---

## 📞 Support

- **Documentation**: This file
- **Team Dashboard**: `/apps/webapp/team/team-dashboard.html`
- **Security Service**: `/apps/backend-ts/src/services/zero-tools-security.ts`
- **Decision Handlers**: `/apps/backend-ts/src/handlers/team/decision-log.ts`
- **Templates**: `/apps/webapp/team/templates/decision-templates.json`

---

## 🎉 You're All Set!

Your team now has:
- ✅ Complete team dashboard
- ✅ AI agents monitoring
- ✅ Zero Tools security layer
- ✅ Decision logging system
- ✅ Audit trail for accountability

**Next steps**:
1. Open the dashboard
2. Log your first decision
3. Set up compliance monitors for sprint deadlines
4. Configure Slack alerts (optional)
5. Start using Zero Tools with confidence!

Happy team collaboration! 🚀
