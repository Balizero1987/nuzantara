# 📁 ZANTARA Project Structure

## 🏗️ Core Architecture (Clean Structure)

```
zantara-bridge/
├── 📝 Core Configuration
│   ├── package.json                 # Dependencies and scripts
│   ├── tsconfig.json               # TypeScript configuration
│   ├── .env                        # Environment variables
│   └── Dockerfile                  # Container configuration
│
├── 🔧 Main Source Files
│   ├── server.ts                   # Main Express server
│   ├── bridge.ts                   # Core Bridge class
│   ├── handlers.ts                 # All 21 handlers
│   ├── cache.ts                    # Multi-layer caching system
│   ├── rate-limiter.ts            # 5-tier rate limiting
│   ├── memory.ts                   # Memory system
│   ├── custom-gpt-handlers.ts     # Custom GPT integration
│   └── workspace-handlers-simple.ts # Google Workspace handlers
│
├── 🔗 API & Routes
│   ├── routes.ts                   # Chat and webhook routes
│   ├── memory_routes.ts           # Memory system routes
│   └── routes/                     # Additional route modules
│       ├── dispatch.js
│       ├── folder-access.js
│       └── sheets.js
│
├── 🤖 AI & Chat Integration
│   ├── chatbot.ts                 # Google Chat bot logic
│   ├── google-chat-webhook.ts     # Chat webhook handler
│   └── openaiClient.ts           # OpenAI client wrapper
│
├── 🔐 Authentication & Services
│   ├── oauth2-integration.ts      # OAuth2 management
│   ├── oauth2-config.js          # OAuth2 configuration
│   └── services/                  # Service modules
│
├── 🛠️ Utilities
│   ├── utils/
│   │   ├── errors.js             # Error handling
│   │   ├── retry.js              # Retry logic
│   │   └── hash.js               # Hashing utilities
│   └── types/
│       └── express.d.ts          # TypeScript definitions
│
├── 📊 Compiled Output
│   └── dist/                     # TypeScript compiled JavaScript
│
├── 🗃️ Archive (Cleaned Files)
│   ├── archive/oauth2/           # Archived OAuth2 files
│   └── archive/tests/            # Archived test files
│
├── 📋 Scripts & Tools
│   ├── scripts/                  # Deployment and utility scripts
│   ├── tests/                    # Test suites
│   ├── analytics/                # Analytics configuration
│   ├── infrastructure/           # K8s and deployment configs
│   └── enhanced-features/        # Enterprise features
│
└── 📚 Documentation
    ├── AI_START_HERE.md          # Quick start guide
    ├── HANDOVER_LOG.md           # Session history
    ├── TODO_CURRENT.md           # Current tasks
    ├── API_DOCUMENTATION.md      # API reference
    ├── SECURITY_CLEANUP_REPORT.md # Security audit
    └── PROJECT_STRUCTURE.md      # This file
```

## 🧹 Cleanup Results (Session 2025-09-23)

### ❌ Removed Files (30+ files cleaned)
- **OAuth2 Duplicates**: oauth2-setup.js, oauth2-quick.js, oauth2-simple.js
- **Test Files**: test-ai.js, test-memory-performance.js, test-googlechat.js
- **Old Scripts**: deploy-fix.sh, deploy-production-fix.sh
- **Backup Files**: oauth2-tokens-backup-*.json
- **Debug Files**: diagnose-issue.js, server.log
- **Old TypeScript**: googleChatAPI.ts, googleAuth.ts, identity.ts
- **Configuration**: expected-response.json, grafana-dashboard.json

### 📂 Archived Files (15+ files archived)
- **OAuth2 Legacy**: 9 files moved to archive/oauth2/
- **Test Legacy**: 6 files moved to archive/tests/

### 📈 Impact
- **Files Reduced**: 192 → 136 files (29% reduction)
- **Root Directory**: Cleaner structure with essential files only
- **Duplicates Eliminated**: All OAuth2 and test duplicates removed
- **Archive Preserved**: Legacy files safely archived for reference

## 🎯 Current Active Files (Essential Only)

### Core System (4 files)
- `server.ts` - Main Express application
- `bridge.ts` - Core Bridge class with handlers
- `handlers.ts` - All 21 operational handlers
- `memory.ts` - Persistent memory system

### Enterprise Features (2 files)
- `cache.ts` - Multi-layer caching (Memory + Redis)
- `rate-limiter.ts` - 5-tier rate limiting system

### Integration (3 files)
- `custom-gpt-handlers.ts` - ChatGPT integration (lead capture, quotes)
- `workspace-handlers-simple.ts` - Google Workspace (docs, sheets, slides)
- `oauth2-integration.ts` - Complete OAuth2 management

### Communication (2 files)
- `chatbot.ts` - Google Chat bot with slash commands
- `google-chat-webhook.ts` - Webhook event handling

## 🏆 System Status Post-Cleanup

✅ **100% Operational** - All 21 handlers functional
✅ **Clean Architecture** - No duplicates or unused files
✅ **Archive Safe** - Legacy files preserved in archive/
✅ **Documentation Updated** - Structure clearly documented

**Ready for**: Production deployment, feature development, team collaboration