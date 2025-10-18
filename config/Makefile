# Makefile - NUZANTARA v5.2.0 Command Center
# All commands for development, deployment, and operations

.PHONY: help
help: ## 📖 Show all available commands
	@echo "🌸 NUZANTARA v5.2.0 - Command Center"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "💡 Tip: Use 'make <command>' to run any command above"

# ==========================================
# 🏃 LOCAL DEVELOPMENT
# ==========================================

.PHONY: dev
dev: ## Start backend in dev mode (port 8080, hot reload)
	npm run dev

.PHONY: dev-rag
dev-rag: ## Start RAG backend locally (port 8000)
	cd "apps/backend-rag/backend" && uvicorn app.main_integrated:app --port 8000 --reload

.PHONY: install
install: ## Install all dependencies
	npm install

.PHONY: build
build: ## Compile TypeScript to dist/
	npm run build

# ==========================================
# 🧪 TESTING
# ==========================================

.PHONY: test
test: ## Run all tests
	npm test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	npm run test:watch

.PHONY: test-coverage
test-coverage: ## Run tests with coverage report
	npm run test:coverage

.PHONY: test-handlers
test-handlers: ## Test new handlers
	npm run test:handlers

.PHONY: health-check
health-check: ## Check local server health (port 8080)
	@echo "🏥 Checking local backend health..."
	@npm run health-check || echo "❌ Server not running. Start with: make dev"

# ==========================================
# 🚀 DEPLOYMENT
# ==========================================

.PHONY: deploy-backend
deploy-backend: ## Deploy TypeScript backend to Railway (production)
	@echo "🚀 Deploying backend to Railway..."
	@railway up || echo "❌ Not linked. Run: railway link"

.PHONY: deploy-backend-quick
deploy-backend-quick: ## Quick deploy (Railway auto-detects changes)
	@echo "⚡ Railway auto-deploys on git push"
	@echo "To force deploy: railway up"

.PHONY: deploy-rag
deploy-rag: ## Deploy RAG backend to Railway
	@echo "🚀 Deploying RAG backend to Railway..."
	@railway up --service scintillating-kindness || echo "❌ Service not found"

.PHONY: deploy-full
deploy-full: ## Deploy full stack (both services)
	@echo "🚀 Deploying full stack to Railway..."
	@railway up

# ==========================================
# 📊 MONITORING & LOGS
# ==========================================

.PHONY: logs
logs: ## Tail backend logs (Railway)
	@echo "📋 Tailing backend logs..."
	@railway logs || echo "❌ Not linked. Run: railway link"

.PHONY: logs-rag
logs-rag: ## Tail RAG backend logs (Railway - scintillating-kindness)
	@echo "📋 Tailing RAG backend logs..."
	@railway logs --service scintillating-kindness || echo "❌ Service not found"

.PHONY: status
status: ## Show status of all Railway services
	@echo "=== 🚂 Railway Services ==="
	@railway status || echo "❌ Not linked. Run: railway link"
	@echo ""
	@echo "=== 🔄 Recent GitHub Actions ==="
	@gh run list --limit 5 || echo "Install gh CLI: brew install gh"

.PHONY: health-prod
health-prod: ## Check production services health
	@echo "🏥 Checking production health..."
	@echo "\n📱 TypeScript Backend:"
	@curl -s https://nuzantara-production.up.railway.app/health | jq '.' || echo "❌ Backend unhealthy"
	@echo "\n🧠 Python RAG Backend:"
	@curl -s https://scintillating-kindness-production-47e3.up.railway.app/health | jq '.' || echo "❌ RAG unhealthy"

.PHONY: metrics
metrics: ## Show production metrics
	@echo "📊 Backend Metrics:"
	@curl -s https://nuzantara-production.up.railway.app/metrics | jq '.'

# ==========================================
# 🔧 MAINTENANCE
# ==========================================

.PHONY: clean
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/.cache
	rm -rf .next
	@echo "✅ Cleaned!"

.PHONY: clean-all
clean-all: clean ## Clean everything (including node_modules)
	@echo "🧹 Deep clean (including node_modules)..."
	rm -rf node_modules/
	@echo "✅ Deep cleaned! Run 'make install' to reinstall"

.PHONY: rebuild
rebuild: clean build ## Clean and rebuild
	@echo "✅ Rebuild complete!"

# ==========================================
# 🐳 DOCKER
# ==========================================

.PHONY: docker-build
docker-build: build ## Build Docker image locally
	@echo "🐳 Building Docker image (AMD64)..."
	docker buildx build --platform linux/amd64 \
		-f Dockerfile.dist \
		-t gcr.io/involuted-box-469105-r0/zantara-v520-nuzantara:local \
		.

.PHONY: docker-run
docker-run: ## Run Docker image locally
	@echo "🐳 Running Docker container..."
	docker run -p 8080:8080 \
		--env-file .env \
		gcr.io/involuted-box-469105-r0/zantara-v520-nuzantara:local

# ==========================================
# 🔐 SECRETS & CONFIG
# ==========================================

.PHONY: secrets-list
secrets-list: ## List GitHub secrets
	@echo "🔑 GitHub Secrets:"
	@gh secret list || echo "Install gh CLI: brew install gh"

.PHONY: gcp-secrets
gcp-secrets: ## List GCP secrets
	@echo "🔑 GCP Secrets:"
	@gcloud secrets list --project=involuted-box-469105-r0

# ==========================================
# 📚 DOCUMENTATION
# ==========================================

.PHONY: docs
docs: ## Open documentation
	@echo "📚 Opening documentation..."
	@echo "- README.md"
	@echo "- ARCHITECTURE.md"
	@echo "- DECISIONS.md"
	@echo "- QUICK_REFERENCE.md"
	@echo "- .claude/PROJECT_CONTEXT.md"
	@open README.md || cat README.md

# ==========================================
# 🐛 DEBUGGING
# ==========================================

.PHONY: debug-handlers
debug-handlers: ## List all registered handlers
	@echo "🔍 Registered handlers:"
	@grep -E '"[a-z.]+":' src/router.ts | head -50

.PHONY: debug-env
debug-env: ## Show environment configuration
	@echo "🔍 Environment:"
	@echo "PORT: $${PORT:-8080}"
	@echo "NODE_ENV: $${NODE_ENV:-development}"
	@echo "FIREBASE_PROJECT_ID: $${FIREBASE_PROJECT_ID:-involuted-box-469105-r0}"
	@echo "ANTHROPIC_API_KEY: $${ANTHROPIC_API_KEY:+✅ Set}"
	@echo "GEMINI_API_KEY: $${GEMINI_API_KEY:+✅ Set}"

# ==========================================
# 🚨 EMERGENCY
# ==========================================

.PHONY: rollback
rollback: ## Rollback to previous Railway deployment
	@echo "⚠️  Rolling back to previous deployment..."
	@railway rollback || echo "❌ Not available. Check Railway dashboard for manual rollback"

.PHONY: emergency-restart
emergency-restart: ## Emergency: Restart Railway service
	@echo "🚨 Restarting Railway service..."
	@railway restart || echo "❌ Not linked. Run: railway link"

# ==========================================
# 🎯 QUICK SHORTCUTS
# ==========================================

.PHONY: up
up: dev ## Alias for 'make dev'

.PHONY: start
start: dev ## Alias for 'make dev'

.PHONY: deploy
deploy: deploy-backend ## Alias for 'make deploy-backend'

.PHONY: log
log: logs ## Alias for 'make logs'

# ==========================================
# 📝 INFO
# ==========================================

.PHONY: info
info: ## Show project information
	@echo "🌸 NUZANTARA v5.2.0"
	@echo ""
	@echo "📍 Location: /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/"
	@echo "🔗 Repository: https://github.com/Balizero1987/nuzantara"
	@echo ""
	@echo "🌐 Production URLs (Railway):"
	@echo "  TypeScript Backend: https://nuzantara-production.up.railway.app"
	@echo "  Python RAG Backend: https://scintillating-kindness-production-47e3.up.railway.app"
	@echo "  Web UI (GitHub Pages): https://balizero1987.github.io/zantara_webapp"
	@echo ""
	@echo "📚 Documentation:"
	@echo "  Architecture: ARCHITECTURE.md"
	@echo "  Decisions:    DECISIONS.md"
	@echo "  Quick Ref:    QUICK_REFERENCE.md"
	@echo "  Context:      .claude/PROJECT_CONTEXT.md"
	@echo ""
	@echo "💡 Run 'make help' to see all commands"

.DEFAULT_GOAL := help
