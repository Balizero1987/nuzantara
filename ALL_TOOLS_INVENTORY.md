# 🛠️ NUZANTARA - Complete Tools Inventory

**Generated:** 28 October 2025  
**Total Tools:** 164+ handlers (TypeScript) + 11 ZantaraTools (Python) = **175+ operational tools**

---

## 📊 Tools Architecture Overview

```
ZANTARA (Claude Sonnet 4)
    ↓
ToolExecutor (Python)
    ↓
    ├─→ ZantaraTools (Python) - 11 tools [DIRECT EXECUTION]
    │   ├─ Team Management
    │   ├─ Memory System
    │   └─ Pricing Service
    │
    └─→ HandlerProxy (HTTP) - 164+ tools [VIA TypeScript BACKEND]
        ├─ Google Workspace
        ├─ Bali Zero Business
        ├─ Communication
        ├─ Analytics
        ├─ AI Services
        └─ System Tools
```

---

## 🔧 ZANTARA TOOLS (Python - Direct Execution)

**Category:** Core Intelligence Functions  
**Execution:** Direct Python calls (no HTTP)  
**Location:** `apps/backend-rag/backend/services/zantara_tools.py`

### Team Management (5 tools)

| Tool Name | Description | Parameters | Returns |
|-----------|-------------|------------|---------|
| `get_team_logins_today` | Get team members who logged in today | None | List of logins with timestamps |
| `get_team_active_sessions` | Get currently active team sessions | None | Active sessions with user details |
| `get_team_member_stats` | Get statistics for specific team member | `member_id: str` | Member activity stats |
| `get_team_overview` | Get complete team overview | None | Team structure, departments, stats |
| `get_team_members_list` | Get list of all team members (public) | `department?: str` | Team roster with roles |
| `search_team_member` | Search team members by name/role/email | `query: str` | Matching team members |

### Memory System (3 tools)

| Tool Name | Description | Parameters | Returns |
|-----------|-------------|------------|---------|
| `retrieve_user_memory` | Retrieve user conversation memory | `user_id: str, key?: str` | User memories and facts |
| `search_memory` | Search memory by query across users | `query: str, user_id?: str` | Matching memories |
| `get_session_details` | Get detailed session information | `session_id: str` | Session logs and context |

### Business Services (3 tools)

| Tool Name | Description | Parameters | Returns |
|-----------|-------------|------------|---------|
| `get_pricing` | Get official Bali Zero pricing | `service_type?: str, specific_service?: str` | Official prices 2025 |
| `end_user_session` | End user session (admin only) | `session_id: str` | Session termination status |

**Note:** These tools are ALWAYS registered with Claude because they're Python native and don't depend on external services.

---

## 🚀 TYPESCRIPT HANDLERS (HTTP Proxy)

**Category:** Extended Business Functions  
**Execution:** HTTP calls to TypeScript backend  
**Location:** `apps/backend-ts/src/handlers/**/*.ts`

### 1️⃣ Identity & Authentication (8 tools)

| Handler Key | Description | Auth Required |
|-------------|-------------|---------------|
| `identity.resolve` | Resolve user identity, create profile if needed | API Key |
| `onboarding.start` | Start user onboarding flow | API Key |
| `team.login` | Team member login (legacy, no PIN) | Demo User |
| `team.login.secure` | Secure PIN-based team login | Demo User |
| `team.login.reset` | Reset failed login attempts (admin) | API Key |
| `team.members` | Get team members list (safe, no emails) | API Key |
| `team.members.legacy` | Get full team list with emails (legacy) | API Key |
| `team.logout` | Logout team member session | Demo User |
| `team.token.verify` | Verify JWT authentication token | API Key |

### 2️⃣ Google Workspace Integration (30+ tools)

#### Gmail (7 tools)
| Handler Key | Description |
|-------------|-------------|
| `gmail.send` | Send email via Gmail API |
| `gmail.list` | List emails with filters |
| `gmail.get` | Get specific email by ID |
| `gmail.search` | Search emails by query |
| `gmail.draft` | Create email draft |
| `gmail.reply` | Reply to email thread |
| `gmail.forward` | Forward email to recipients |

#### Google Drive (5 tools)
| Handler Key | Description |
|-------------|-------------|
| `drive.upload` | Upload file to Google Drive |
| `drive.list` | List Drive files with filters |
| `drive.search` | Search Drive files by query |
| `drive.read` | Read Drive file content |
| `drive.download` | Download file from Drive |

#### Google Calendar (3 tools)
| Handler Key | Description |
|-------------|-------------|
| `calendar.create` | Create calendar event |
| `calendar.list` | List calendar events with filters |
| `calendar.get` | Get specific event details |

#### Google Sheets (3 tools)
| Handler Key | Description |
|-------------|-------------|
| `sheets.read` | Read data from spreadsheet |
| `sheets.append` | Append rows to spreadsheet |
| `sheets.create` | Create new spreadsheet |

#### Google Docs (3 tools)
| Handler Key | Description |
|-------------|-------------|
| `docs.create` | Create new Google Doc |
| `docs.read` | Read Doc content |
| `docs.update` | Update Doc content |

#### Google Slides (3 tools)
| Handler Key | Description |
|-------------|-------------|
| `slides.create` | Create new presentation |
| `slides.read` | Read slides content |
| `slides.update` | Update presentation |

#### Google Contacts (2 tools)
| Handler Key | Description |
|-------------|-------------|
| `contacts.list` | List Google Contacts |
| `contacts.create` | Create new contact |

### 3️⃣ Bali Zero Business Services (15 tools)

#### Pricing & Services
| Handler Key | Description | CRITICAL |
|-------------|-------------|----------|
| `bali.zero.pricing` | **OFFICIAL PRICING 2025** - Anti-hallucination safeguard | ✅ |
| `bali.zero.price` | Quick price lookup by service name | ✅ |
| `pricing.official` | Alias for bali.zero.pricing | ✅ |
| `price.lookup` | Alias for quick price lookup | ✅ |

#### Team Management
| Handler Key | Description |
|-------------|-------------|
| `team.list` | List team members with department/role filters |
| `team.get` | Get specific team member details |
| `team.departments` | Get department structure |
| `team.test.recognition` | Test team member recognition (dev) |
| `team.recent_activity` | Get recent team activity logs |

#### Oracle & Advisory
| Handler Key | Description |
|-------------|-------------|
| `oracle.simulate` | Simulate business scenarios |
| `oracle.analyze` | Analyze business data |
| `oracle.predict` | Predict business outcomes |
| `document.prepare` | Prepare legal/business documents |
| `assistant.route` | Route queries to appropriate advisor |

#### KBLI Business Codes
| Handler Key | Description |
|-------------|-------------|
| `kbli.lookup` | Search Indonesian business classification codes |
| `kbli.requirements` | Get requirements for KBLI code |

### 4️⃣ Memory & Context (15 tools)

#### User Memory (3 tools)
| Handler Key | Description |
|-------------|-------------|
| `memory.save` | Save user memory/preference |
| `memory.search` | Search memories by query |
| `memory.retrieve` | Retrieve user memories |

#### Advanced Memory (8 tools)
| Handler Key | Description |
|-------------|-------------|
| `memory.list` | List all memories for user |
| `memory.search.entity` | Search by entity (person/project/skill) |
| `memory.entities` | Get all entities related to user |
| `memory.entity.info` | Get complete entity profile |
| `memory.event.save` | Save timestamped episodic event |
| `memory.timeline.get` | Get timeline of events |
| `memory.entity.events` | Get events mentioning entity |
| `memory.search.semantic` | Semantic search using embeddings |

#### Memory Performance
| Handler Key | Description |
|-------------|-------------|
| `memory.search.hybrid` | Hybrid keyword + semantic search |
| `memory.cache.stats` | Get memory cache statistics |
| `memory.cache.clear` | Clear memory cache |

#### Team Member Memory
| Handler Key | Description |
|-------------|-------------|
| `user.memory.save` | Save memory for team member |
| `user.memory.retrieve` | Retrieve team member memory |
| `user.memory.list` | List team member memories |
| `user.memory.login` | Team member memory login |

### 5️⃣ AI Services (10 tools)

#### Core AI
| Handler Key | Description |
|-------------|-------------|
| `ai.chat` | **ZANTARA-ONLY AI chat** with anti-hallucination |
| `ai.anticipate` | Anticipate user needs |
| `ai.learn` | Learn from interactions |
| `xai.explain` | Explain AI reasoning (XAI) |

#### Creative AI
| Handler Key | Description |
|-------------|-------------|
| `creative.art.generate` | Generate artistic content |
| `creative.music.compose` | Compose music |
| `creative.story.write` | Write creative stories |
| `creative.poem.generate` | Generate poetry |
| `creative.image.style` | Apply artistic styles to images |
| `creative.design.mockup` | Create design mockups |

### 6️⃣ Communication (18 tools)

#### Translation
| Handler Key | Description |
|-------------|-------------|
| `translate.text` | Translate text between languages |
| `translate.batch` | Batch translate multiple texts |
| `detect.language` | Detect language of text |

#### Notifications
| Handler Key | Description |
|-------------|-------------|
| `slack.notify` | Send Slack notification |
| `discord.notify` | Send Discord notification |
| `googlechat.notify` | Send Google Chat notification |

#### WhatsApp Business
| Handler Key | Description |
|-------------|-------------|
| `whatsapp.webhook.verify` | Verify WhatsApp webhook (Meta) |
| `whatsapp.webhook.receiver` | Receive WhatsApp messages |
| `whatsapp.analytics` | Get WhatsApp group analytics |
| `whatsapp.send` | Send manual WhatsApp message |

#### Twilio WhatsApp
| Handler Key | Description |
|-------------|-------------|
| `twilio.whatsapp.webhook` | Twilio WhatsApp webhook receiver |
| `twilio.whatsapp.send` | Send WhatsApp via Twilio |

#### Instagram Business
| Handler Key | Description |
|-------------|-------------|
| `instagram.webhook.verify` | Verify Instagram webhook (Meta) |
| `instagram.webhook.receiver` | Receive Instagram messages |
| `instagram.analytics` | Get Instagram user analytics |
| `instagram.send` | Send manual Instagram message |

### 7️⃣ RAG & Knowledge Base (4 tools)

| Handler Key | Description |
|-------------|-------------|
| `rag.query` | Query RAG backend with LLM answer generation |
| `rag.search` | Semantic search only (no LLM) |
| `rag.health` | Check RAG backend health |
| `bali.zero.chat` | Bali Zero specialized chatbot (Haiku/Sonnet routing) |

### 8️⃣ ZANTARA Intelligence Framework (20 tools)

#### ZANTARA v1.0 - Core Collaboration
| Handler Key | Description |
|-------------|-------------|
| `zantara.personality.profile` | Get user personality profile |
| `zantara.attune` | Attune to user communication style |
| `zantara.synergy.map` | Map team synergy patterns |
| `zantara.anticipate.needs` | Anticipate user needs |
| `zantara.communication.adapt` | Adapt communication style |
| `zantara.learn.together` | Collaborative learning |
| `zantara.mood.sync` | Sync with user emotional state |
| `zantara.conflict.mediate` | Mediate team conflicts |
| `zantara.growth.track` | Track personal growth |
| `zantara.celebration.orchestrate` | Orchestrate celebrations |

#### ZANTARA v2.0 - Advanced Intelligence
| Handler Key | Description |
|-------------|-------------|
| `zantara.emotional.profile.advanced` | Advanced emotional profiling |
| `zantara.conflict.prediction` | Predict potential conflicts |
| `zantara.multi.project.orchestration` | Orchestrate multiple projects |
| `zantara.client.relationship.intelligence` | Client relationship intelligence |
| `zantara.cultural.intelligence.adaptation` | Cultural adaptation |
| `zantara.performance.optimization` | Optimize team performance |

#### ZANTARA Dashboard
| Handler Key | Description |
|-------------|-------------|
| `zantara.dashboard.overview` | Dashboard overview |
| `zantara.team.health.monitor` | Monitor team health |
| `zantara.performance.analytics` | Performance analytics |
| `zantara.system.diagnostics` | System diagnostics |

### 9️⃣ Analytics & Reporting (12 tools)

#### Dashboard Analytics
| Handler Key | Description |
|-------------|-------------|
| `dashboard.main` | Main dashboard overview |
| `dashboard.conversations` | Conversation metrics |
| `dashboard.services` | Service usage metrics |
| `dashboard.handlers` | Handler performance metrics |
| `dashboard.health` | System health metrics |
| `dashboard.users` | User activity metrics |

#### Reports
| Handler Key | Description |
|-------------|-------------|
| `report.weekly.generate` | Generate weekly report |
| `report.weekly.schedule` | Schedule weekly report |
| `report.monthly.generate` | Generate monthly report |
| `report.monthly.schedule` | Schedule monthly report |

#### Activity Tracking
| Handler Key | Description |
|-------------|-------------|
| `daily.recap.update` | Update daily recap |
| `daily.recap.current` | Get current daily recap |

### 🔟 Maps & Location (3 tools)

| Handler Key | Description |
|-------------|-------------|
| `maps.directions` | Get directions between locations |
| `maps.places` | Search for places |
| `maps.placeDetails` | Get detailed place information |

### 1️⃣1️⃣ Intel & News (6 tools)

| Handler Key | Description |
|-------------|-------------|
| `intel.news.search` | Search Bali news and intelligence |
| `intel.news.critical` | Get critical news updates |
| `intel.news.trends` | Get trending topics |
| `intel.scraper.run` | Run web scraper for news |
| `intel.scraper.status` | Check scraper status |
| `intel.scraper.categories` | Get scraper categories |

### 1️⃣2️⃣ System Administration (10 tools)

#### System Introspection
| Handler Key | Description |
|-------------|-------------|
| `system.handlers.list` | List all available handlers |
| `system.handlers.category` | Get handlers by category |
| `system.handlers.get` | Get specific handler details |
| `system.handlers.tools` | Get Anthropic tool definitions |
| `system.handler.execute` | Execute handler programmatically |
| `system.handlers.batch` | Execute multiple handlers in batch |

#### WebSocket Management
| Handler Key | Description |
|-------------|-------------|
| `websocket.stats` | Get WebSocket connection stats |
| `websocket.broadcast` | Broadcast message to all clients |
| `websocket.send` | Send message to specific user |

#### OAuth2 Management
| Handler Key | Description |
|-------------|-------------|
| `oauth2.status` | Get OAuth2 token status |
| `oauth2.refresh` | Force token refresh |
| `oauth2.available` | Check OAuth2 availability |

### 1️⃣3️⃣ Business Logic (3 tools)

| Handler Key | Description |
|-------------|-------------|
| `contact.info` | Get Bali Zero contact information |
| `lead.save` | Save new lead to CRM |
| `quote.generate` | Generate service quotation |

---

## 📈 Tool Usage Statistics

### By Category

| Category | Tool Count | Execution Method |
|----------|------------|------------------|
| **ZantaraTools (Python)** | 11 | Direct Python |
| **Google Workspace** | 30 | HTTP Proxy |
| **Bali Zero Business** | 15 | HTTP Proxy |
| **Memory System** | 15 | HTTP Proxy |
| **AI Services** | 10 | HTTP Proxy |
| **Communication** | 18 | HTTP Proxy |
| **RAG & Knowledge** | 4 | HTTP Proxy |
| **ZANTARA Intelligence** | 20 | HTTP Proxy |
| **Analytics & Reports** | 12 | HTTP Proxy |
| **Maps & Location** | 3 | HTTP Proxy |
| **Intel & News** | 6 | HTTP Proxy |
| **System Administration** | 10 | HTTP Proxy |
| **Business Logic** | 3 | HTTP Proxy |
| **Identity & Auth** | 8 | HTTP Proxy |
| **TOTAL** | **175+** | Mixed |

### By Execution Type

- **Python Direct:** 11 tools (ZantaraTools)
- **TypeScript HTTP:** 164+ tools (handlers)

### By Authentication

- **API Key Required:** 140+ tools
- **JWT Required:** 6 tools (dashboard)
- **Demo User:** 10 tools
- **Admin Only:** 8 tools
- **Public/No Auth:** 5 tools

---

## 🔍 Tool Discovery & Registration

### How Tools Are Loaded

```python
# In main_cloud.py startup:

# 1. Initialize ZantaraTools (Python)
zantara_tools = ZantaraTools(...)  # 11 tools

# 2. Initialize ToolExecutor
tool_executor = ToolExecutor(
    handler_proxy=handler_proxy_service,
    internal_key=internal_key,
    zantara_tools=zantara_tools
)

# 3. Get all available tools for Claude
tools = await tool_executor.get_available_tools()
# Returns: 175+ tools in Anthropic format

# 4. Pass to Claude via IntelligentRouter
router = IntelligentRouter(
    ...,
    tools=tools  # Claude gets full tool list
)
```

### Tool Definition Format (Anthropic)

```python
{
    "name": "get_pricing",
    "description": "Get official Bali Zero pricing data (2025 pricelist). Returns hardcoded official prices only - NO AI generation.",
    "input_schema": {
        "type": "object",
        "properties": {
            "service_type": {
                "type": "string",
                "description": "Service category: visa, kitas, kitap, business, tax, or all",
                "enum": ["visa", "kitas", "kitap", "business", "tax", "all"]
            },
            "specific_service": {
                "type": "string",
                "description": "Search for specific service by name (e.g. 'C1 Tourism', 'Working KITAS')"
            }
        },
        "required": []
    }
}
```

---

## 🚨 CRITICAL TOOLS (Production Priority)

### 1. Pricing Tools (Anti-Hallucination)

```typescript
// MUST USE for ANY pricing question
"bali.zero.pricing"     // Official prices ONLY
"pricing.official"      // Alias
"bali.zero.price"       // Quick lookup
"price.lookup"          // Alias
```

**Rule:** ZANTARA MUST call these tools BEFORE answering any pricing question. NEVER generate prices from memory.

### 2. Team Management Tools

```python
# ZantaraTools (Python) - ALWAYS available
"get_team_members_list"  # Team roster
"search_team_member"     # Find team member
"get_team_overview"      # Complete team structure
```

### 3. Memory Tools

```python
# ZantaraTools (Python) - ALWAYS available
"retrieve_user_memory"   # Get user context
"search_memory"          # Search across memories
```

```typescript
// TypeScript handlers - Extended memory
"memory.save"            // Save new memory
"memory.retrieve"        // Retrieve memory
"memory.search"          // Search memory
```

### 4. AI Chat (ZANTARA-ONLY)

```typescript
"ai.chat"  // Main ZANTARA chat with anti-hallucination
```

**Rule:** Blocks pricing queries and redirects to `bali.zero.pricing` tool.

---

## 🔒 Tool Access Control

### By API Key Type

#### `zantara-internal-dev-key-2025` (Internal)
- ✅ Full access to all 175+ tools
- ✅ Admin operations
- ✅ System introspection

#### External API Keys
- ✅ Most business tools
- ❌ Admin operations blocked
- ❌ System introspection blocked
- ❌ Report generation blocked

#### Demo User Keys
- ✅ Basic chat operations
- ✅ Translation
- ❌ Team management
- ❌ Admin operations

### Forbidden for External Keys

```typescript
const FORBIDDEN_FOR_EXTERNAL = [
  "report.generate",
  // Admin tools automatically blocked by middleware
];
```

---

## 📝 Tool Naming Conventions

### Pattern: `category.subcategory.action`

Examples:
- `gmail.send` → Gmail category, send action
- `memory.search.semantic` → Memory category, search subcategory, semantic action
- `team.login.secure` → Team category, login subcategory, secure variant

### Python Tools: `snake_case`

Examples:
- `get_pricing`
- `search_team_member`
- `retrieve_user_memory`

### TypeScript Handlers: `dot.notation`

Examples:
- `bali.zero.pricing`
- `system.handlers.list`
- `zantara.dashboard.overview`

---

## 🧪 Testing Tools

### Via `/call` Endpoint

```bash
curl -X POST https://nuzantara.up.railway.app/call \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bali.zero.pricing",
    "params": {
      "service_type": "visa",
      "include_details": true
    }
  }'
```

### Via `/handler` Endpoint

```bash
curl -X POST https://nuzantara.up.railway.app/handler \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "handler": "team.list",
    "params": {
      "department": "setup"
    }
  }'
```

### Test Suite Location

```
e2e-tests/
├── zantara-live-test.spec.ts          # 102 questions live test
├── zantara-analysis-test.spec.ts      # Answer quality analysis
├── zantara-tools-verification.spec.ts # Tool integration tests
└── test-questions.json                # Test dataset
```

---

## 🐛 Known Issues

### 1. ❌ Pricing Tool Not Called

**Issue:** Despite system prompt enforcement, Claude doesn't call `bali.zero.pricing`  
**Evidence:** Query "berapa harga D12 visa?" received but no tool call logged  
**Impact:** ZANTARA generates prices from training memory (hallucination risk)  
**Status:** INVESTIGATING

### 2. ❌ Memory Tool Low Success Rate

**Issue:** `memory.save` and `memory.retrieve` have 0-33% success rate  
**Evidence:** Test "Remember: my budget is 500 million" → No save confirmation  
**Impact:** User context not persisted correctly  
**Status:** NEEDS FIX

### 3. ❌ Team Tool Broken

**Issue:** `team.list` returns 0% success in tests  
**Evidence:** Query "Who is in the Bali Zero team?" → No team data  
**Impact:** ZANTARA can't provide team information  
**Status:** NEEDS FIX

### 4. ⚠️ Tool Selection Not Optimal

**Issue:** Claude may not recognize when to use specific tools  
**Hypothesis:** Tool descriptions need improvement  
**Next Step:** Review tool descriptions for clarity  
**Status:** INVESTIGATING

---

## 🔧 Tool Registration Checklist

### For New Tools

- [ ] Add handler function in appropriate category folder
- [ ] Export function from handler file
- [ ] Register in `router.ts` handlers map
- [ ] Add tool description (clear WHEN to use it)
- [ ] Define input schema with validation
- [ ] Add examples in JSDoc
- [ ] Test via `/call` endpoint
- [ ] Test via ZANTARA chat
- [ ] Verify tool appears in `system.handlers.tools`
- [ ] Check Railway logs for tool execution

---

## 📚 Documentation References

### Code Locations

- **TypeScript Handlers:** `apps/backend-ts/src/handlers/**/*.ts`
- **Handler Registry:** `apps/backend-ts/src/core/handler-registry.ts`
- **Router:** `apps/backend-ts/src/routing/router.ts`
- **ZantaraTools:** `apps/backend-rag/backend/services/zantara_tools.py`
- **ToolExecutor:** `apps/backend-rag/backend/services/tool_executor.py`
- **System Prompt:** `apps/backend-rag/backend/app/main_cloud.py` (lines 117-517)

### Configuration Files

- **Pricing Data:** `apps/backend-rag/backend/data/bali_zero_official_prices_2025.json`
- **Team Data:** Hardcoded in `apps/backend-ts/src/handlers/bali-zero/team.ts`
- **Environment:** `.env` files (not in repo)

---

## 📞 Contact

**For Tool Issues:**
- Check Railway logs: `https://railway.app/project/.../deployments`
- Review test results: `e2e-tests/*.spec.ts`
- Check Copilot Instructions: `.github/copilot-instructions.md`

**Bali Zero Contact:**
- Email: info@balizero.com
- WhatsApp: +62 859 0436 9574
- Instagram: @balizero0
- Office: Kerobokan, Bali

---

**Last Updated:** 28 October 2025 by GitHub Copilot  
**Version:** 1.0.0  
**Status:** 🔴 50% tool integration success rate - NEEDS INVESTIGATION
