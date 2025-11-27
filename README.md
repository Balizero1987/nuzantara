# NUZANTARA Platform

**Production-ready AI platform powered by ZANTARA - Bali Zero's intelligent business assistant**

## 🌟 Overview

Nuzantara is a comprehensive AI-powered knowledge management platform built with modern technologies. It provides intelligent business assistance, RAG (Retrieval-Augmented Generation) capabilities, memory management, and a beautiful Next.js frontend.

## 🏗️ Architecture

### Monorepo Structure

```
nuzantara/
├── apps/                          # Applications principali
│   ├── backend-rag/              # Python FastAPI - RAG AI Engine
│   ├── bali-intel-scraper/       # Python - Web scraper
│   ├── memory-service/           # TypeScript/Node.js - Memory management
│   └── webapp-next/              # Next.js 16 + React 19 - Frontend
├── packages/                     # Package condivisi
│   ├── config/                   # Configurazioni globali
│   ├── types/                    # Tipi TypeScript
│   └── utils/                    # Utilità condivise
├── deploy/                       # Configurazioni deployment
├── scripts/                      # Script automazione
└── docs/                         # Documentazione
```

### Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend RAG**: Python 3.11+, FastAPI, PostgreSQL, Redis, Qdrant
- **Memory Service**: Node.js, TypeScript, PostgreSQL, Redis
- **AI Providers**: OpenAI, Anthropic, Google Gemini, Custom Models
- **Deployment**: Docker, Fly.io
- **Database**: PostgreSQL, Redis, Qdrant Vector DB

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+ and pip
- PostgreSQL 15+
- Redis 6+ (optional, for caching)
- Docker and Docker Compose

### 1. Clone Repository

```bash
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara
```

### 2. Environment Setup

Copy the environment template and configure your values:

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key environment variables to configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nuzantara_db
REDIS_URL=redis://localhost:6379

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Security
JWT_SECRET_KEY=your-super-secret-jwt-key
```

### 3. Install Dependencies

```bash
# Install Node.js dependencies for all packages
npm install

# Install Python dependencies
cd apps/backend-rag
pip install -r requirements.txt
cd ../..
```

### 4. Database Setup

```bash
# Create database
createdb nuzantara_db
createdb memory_db

# Run migrations (if available)
npm run db:migrate
```

### 5. Development Mode

Start all services in development:

```bash
# Start backend RAG service (port 8000)
cd apps/backend-rag
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000 &

# Start memory service (port 8080)
cd ../memory-service
npm run dev &

# Start frontend (port 3000)
cd ../webapp-next
npm run dev
```

Or use Docker Compose:

```bash
docker-compose up -d
```

### 6. Access the Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Memory Service**: http://localhost:8080
- **Health Checks**:
  - Backend: http://localhost:8000/health
  - Memory: http://localhost:8080/health

## 📦 Package Management

This is a monorepo using npm workspaces:

```bash
# Install dependencies across all packages
npm install

# Run script in specific package
npm run dev --workspace=@nuzantara/webapp-next

# Build all packages
npm run build

# Run tests across all packages
npm test
```

## 🔧 Configuration

### Environment Variables

See [`.env.example`](.env.example) for all available configuration options.

### CORS Configuration

Configure allowed origins for your environment:

```bash
# Development
CORS_ORIGINS=http://localhost:3000,http://localhost:4173

# Production
CORS_ORIGINS=https://yourdomain.com
```

### Logging

Configure logging levels and formats:

```bash
LOG_LEVEL=info          # debug, info, warn, error
LOG_FORMAT=json        # json or text
```

## 🚀 Deployment

### Fly.io Deployment

1. Install Fly CLI and authenticate:

```bash
fly auth login
```

2. Set your app name in the environment:

```bash
export FLY_APP_NAME=nuzantara
```

3. Deploy:

```bash
# Deploy using the provided script
./scripts/deploy-fly.sh

# Or manually
fly launch
fly deploy
```

### Docker Deployment

Build and run with Docker:

```bash
# Build all services
docker-compose build

# Run in production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Considerations

- **Development**: Use local database URLs and enable debug features
- **Production**: Use production URLs, disable debug features, configure SSL

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=@nuzantara/webapp-next

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Test Structure

- Unit tests: `**/*.test.ts` or `**/*.test.py`
- Integration tests: `**/*.integration.test.ts`
- E2E tests: Using Playwright in `e2e/`

## 📊 Monitoring & Observability

### Health Checks

All services expose health check endpoints:

```bash
GET /health
```

Response format:

```json
{
  "status": "healthy",
  "timestamp": "2024-11-28T10:00:00Z",
  "service": "backend-rag",
  "version": "5.2.0"
}
```

### Logging

Structured logging with correlation IDs:

```typescript
import { createLogger } from '@nuzantara/utils';

const logger = createLogger({
  service: 'my-service',
  level: 'info'
});

logger.info('User authenticated', { userId: '123' });
```

### Metrics

Configure monitoring with your preferred service (optional):

```bash
SENTRY_DSN=https://...@sentry.io/...
```

## 🔒 Security

### Authentication

JWT-based authentication with refresh tokens:

```bash
# Configure
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRE_HOURS=24
```

### Security Headers

Built-in security with Helmet.js:

```bash
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

### Rate Limiting

Configure API rate limits:

```bash
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_BURST=10
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Quality

- Use TypeScript for type safety
- Follow ESLint configuration: `npm run lint:fix`
- Format code with Prettier: `npm run format`
- Write tests for new features

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Architecture Guide](./docs/architecture.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, and 8080 are available
2. **Database connection**: Verify DATABASE_URL is correct
3. **CORS errors**: Check CORS_ORIGINS configuration
4. **API keys**: Ensure all required API keys are set

### Getting Help

- Check the [GitHub Issues](https://github.com/Balizero1987/nuzantara/issues)
- Review existing documentation
- Check logs for error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Version History

- **v5.2.0** (Current) - Production-ready with AI integration
- **v5.1.0** - Added memory management system
- **v5.0.0** - Complete rewrite with modern architecture
- **v4.x.x** - Legacy versions

## 👥 Team

- **Bali Zero** - Lead Developer & Architect
- **Nuzantara Team** - Development & Support

---

**Built with ❤️ in Bali**

For more information, visit [nuzantara.com](https://nuzantara.com) or contact support@nuzantara.com