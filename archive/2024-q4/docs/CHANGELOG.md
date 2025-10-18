# Changelog

All notable changes to NUZANTARA Railway project.

## [3.0.0] - 2025-10-18

### 🏗️ Architecture Changes
- **REMOVED**: LLAMA from frontend (now only background jobs)
- **CHANGED**: QUADRUPLE-AI → TRIPLE-AI system
- **ADDED**: Pattern matching for intent classification (0ms, $0)
- **ADDED**: Claude Haiku for greetings/casual (60% traffic)
- **ADDED**: Claude Sonnet for business queries (35% traffic)
- **KEPT**: DevAI Qwen for code analysis (internal only)

### 📁 Project Structure
- **MOVED**: `src/` → `apps/backend-ts/src/`
- **MOVED**: `scripts/llama_*.py` → `apps/backend-rag/scripts/`
- **UPDATED**: Monorepo structure with clear separation

### 📚 Documentation
- **CLEANED**: 183 → 43 files (-76% reduction)
- **REMOVED**: Obsolete reports, sessions, duplicates
- **CREATED**: New consolidated architecture docs
- **UPDATED**: All docs reflect current TRIPLE-AI system

### 🔧 Configuration
- **UPDATED**: `tsconfig.json` for new src path
- **UPDATED**: `package.json` scripts for new structure
- **UPDATED**: `railway_cron.toml` for new script paths

## [2.5.0] - 2025-10-17

### Features
- Extreme documentation cleanup executed
- GCP emergency shutdown complete
- Google Gemini dispute resolved

## [2.0.0] - 2025-10-14

### Features
- DevAI Qwen 2.5 Coder integration
- LLAMA batch classifier for intel
- System prompts upgrade
- Modern AI integration

## [1.5.0] - 2025-10-09

### Features
- Quick wins implementation
- Twilio removed (unused)
- Priority tasks completed

## [1.0.0] - 2025-10-05

### Initial Release
- Railway migration from GCP
- RAG backend with ChromaDB
- Initial LLAMA integration
- Basic handler system

---

## Change Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

**Versioning**: Semantic Versioning (MAJOR.MINOR.PATCH)
