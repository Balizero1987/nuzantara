# Bali Zero Tax Platform - Complete Deployment Guide

## 🎉 Status: Phase 1 Complete & Ready for Deployment

### What's Working:
- ✅ Backend API with authentication (JWT)
- ✅ Company management CRUD operations
- ✅ Frontend React dashboard with all screens
- ✅ Mock data for development/testing
- ✅ Full integration tested locally

---

## 📁 Repository Structure

```
nuzantara/
├── apps/backend-ts/                    # Backend API (Node.js + TypeScript)
│   ├── src/
│   │   ├── handlers/tax/              # Tax platform handlers
│   │   │   ├── auth.ts                # Authentication (JWT)
│   │   │   ├── companies.ts           # Company CRUD
│   │   │   └── README.md              # API documentation
│   │   ├── routes/
│   │   │   ├── tax.routes.ts          # Tax route definitions
│   │   │   └── index.ts               # Route registry
│   │   └── migrations/                # Database migrations (ready to run)
│   │       ├── 001_create_tax_platform_tables.sql
│   │       └── 002_create_tax_platform_tables_part2.sql
│   └── package.json
│
├── frontend-tax-dashboard/             # Frontend React app
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   ├── pages/                     # Page components
│   │   ├── utils/                     # API utilities
│   │   └── context/                   # Auth context
│   ├── package.json
│   └── README.md
│
└── Planning Docs/                      # Complete technical specs
    ├── BALI_ZERO_TAX_PLATFORM_COMPLETE_SPEC.md
    ├── BALI_ZERO_TAX_PLATFORM_SPEC.md (Part 1-4)
    ├── BALI_ZERO_TAX_UI_DESIGN_SYSTEM.md
    ├── BALI_ZERO_TAX_UI_DRAFT.html
    ├── BALI_ZERO_TAX_PLATFORM_PRESENTATION.md
    ├── EMAIL_FOR_VERONIKA.md
    └── GITHUB_SPARK_INSTRUCTIONS.md
```

---

## 🚀 Local Development

### Backend Setup

```bash
cd /home/user/nuzantara/apps/backend-ts
npm install
npm run dev
# Backend runs at http://localhost:8080
```

### Frontend Setup

```bash
cd /home/user/nuzantara/frontend-tax-dashboard
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

### Test Credentials

```
Email: angel@balizero.com
Password: demo123

Alternative:
Email: veronika@balizero.com
Password: demo123
```

### Test the Integration

1. Open http://localhost:3000 in your browser
2. Login with test credentials
3. You should see dashboard with 3 mock companies
4. Try creating a new company
5. View company profile

---

## 🗄️ Database Setup (PostgreSQL)

### Prerequisites
- PostgreSQL 15+
- Database connection string

### Run Migrations

```bash
cd apps/backend-ts

# Connect to your database and run migrations in order:
psql $DATABASE_URL -f migrations/001_create_tax_platform_tables.sql
psql $DATABASE_URL -f migrations/002_create_tax_platform_tables_part2.sql
```

### Environment Variables

Create `.env` file in `apps/backend-ts/`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=8080
NODE_ENV=production
```

### After Database is Connected

Update handler files to use real database queries instead of mock data:
- `apps/backend-ts/src/handlers/tax/auth.ts` - lines with `// TODO: replace with DB query`
- `apps/backend-ts/src/handlers/tax/companies.ts` - lines with `// TODO: Insert into database`

---

## 🌐 Production Deployment

### Option 1: Deploy to Fly.io (Recommended)

#### Backend Deployment

```bash
cd apps/backend-ts

# Install fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly launch --name bali-zero-tax-api --region sin

# Set environment variables
fly secrets set JWT_SECRET=your-production-secret
fly secrets set DATABASE_URL=your-postgresql-url

# Deploy
fly deploy
```

#### Frontend Deployment to Cloudflare Pages

```bash
cd frontend-tax-dashboard

# Build for production
npm run build
# This creates dist/ folder

# Option A: Upload via Cloudflare Dashboard
1. Go to Cloudflare Pages dashboard
2. Create new project: "bali-zero-tax-dashboard"
3. Upload dist/ folder
4. Set environment variable:
   - VITE_API_BASE=https://bali-zero-tax-api.fly.dev

# Option B: Use Wrangler CLI
npm install -g wrangler
wrangler login
wrangler pages deploy dist/ --project-name=bali-zero-tax-dashboard
```

### Option 2: Deploy to Vercel

#### Backend to Vercel

```bash
cd apps/backend-ts

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### Frontend to Vercel

```bash
cd frontend-tax-dashboard

vercel

# Set environment variable:
VITE_API_BASE=https://your-backend-url.vercel.app
```

### Option 3: Deploy to Your Own Server (VPS/Docker)

#### Using Docker

Create `Dockerfile` in `apps/backend-ts/`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
EXPOSE 8080
CMD ["npm", "start"]
```

Create `Dockerfile` in `frontend-tax-dashboard/`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Deploy with Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./apps/backend-ts
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: always

  frontend:
    build: ./frontend-tax-dashboard
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=balizero_tax
      - POSTGRES_USER=balizero
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

volumes:
  pgdata:
```

Run with:
```bash
docker-compose up -d
```

---

## 🔐 Security Checklist (Before Production)

- [ ] Change JWT_SECRET to a strong random value (32+ characters)
- [ ] Enable HTTPS for both frontend and backend
- [ ] Set up proper CORS origins (not `*`)
- [ ] Review and harden rate limiting settings
- [ ] Enable database backups
- [ ] Set up monitoring and logging (e.g., Sentry, Loki)
- [ ] Review user permissions and roles
- [ ] Enable audit trail in production
- [ ] Set up firewall rules on database
- [ ] Use environment-specific .env files
- [ ] Enable 2FA for production deployments
- [ ] Set up CI/CD pipeline (GitHub Actions)

---

## 📊 API Endpoints

### Authentication
- `POST /api/tax/auth/login` - User login
- `GET /api/tax/auth/me` - Current user info

### Companies
- `GET /api/tax/companies` - List companies (with filters, pagination)
- `POST /api/tax/companies` - Create company
- `GET /api/tax/companies/:id` - Get company details
- `PUT /api/tax/companies/:id` - Update company
- `DELETE /api/tax/companies/:id` - Delete company (soft delete)

### Future Endpoints (Phase 2+)
- Tax calculations endpoints
- Jurnal.id sync endpoints
- Invoice generation endpoints
- Payment tracking endpoints
- Document management endpoints

Full API documentation: `apps/backend-ts/src/handlers/tax/README.md`

---

## 🧪 Testing

### Backend API Testing

```bash
# Login
curl -X POST http://localhost:8080/api/tax/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"angel@balizero.com","password":"demo123"}'

# Get companies (requires token from login)
curl -X GET "http://localhost:8080/api/tax/companies" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create company
curl -X POST http://localhost:8080/api/tax/companies \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "PT Test Company",
    "legal_entity_type": "PT",
    "email": "test@example.com"
  }'
```

### Frontend Testing

1. Open browser DevTools (F12)
2. Go to Network tab
3. Login and watch API calls
4. Check Console for any JavaScript errors
5. Test all features:
   - Login/Logout
   - Dashboard loading
   - Company list with search
   - Create new company
   - View company profile
   - Form validation

---

## 📈 Monitoring & Logs

### Check Backend Logs

```bash
# Local development
tail -f /tmp/backend.log

# Fly.io
fly logs

# Vercel
vercel logs

# Docker
docker-compose logs -f backend
```

### Check Frontend Logs

```bash
# Local development
tail -f /tmp/frontend.log

# Browser console (F12)
```

---

## 🔄 Continuous Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Tax Platform

on:
  push:
    branches: [main, claude/code-session-*]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy apps/backend-ts
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend-tax-dashboard && npm install && npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: bali-zero-tax-dashboard
          directory: frontend-tax-dashboard/dist
```

---

## 📞 Support & Next Steps

### Phase 1 Complete ✅
- Backend API (Auth + Companies)
- Frontend UI (Login, Dashboard, Forms, Profile)
- Mock data for testing

### Phase 2: Jurnal.id Integration (Weeks 3-4)
- Connect to Jurnal.id API
- Sync financial data
- Display financial summaries in dashboard

### Phase 3: Tax Calculations (Weeks 5-6)
- Implement PPh 25/29/21 calculations
- Tax calendar and payment tracking
- E-SPT generation

### Phase 4: Client Portal (Weeks 7-8)
- my.balizero.com integration
- Client-facing dashboard
- Secure data sync

### Phase 5: ZANTARA Integration (Weeks 9-10)
- AI tax insights
- Anomaly detection
- Recommendations engine

### Phase 6: Invoicing (Weeks 11-12)
- Invoice generation
- Payment tracking
- Client billing

---

## 🎯 Quick Commands Reference

```bash
# Start everything locally
cd apps/backend-ts && npm run dev &
cd frontend-tax-dashboard && npm run dev &

# Stop everything
pkill -f "tsx watch"
pkill -f "vite"

# Rebuild and test
cd frontend-tax-dashboard && npm run build && npm run preview

# Check if services are running
curl http://localhost:8080/health
curl http://localhost:3000

# View logs
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

---

## ✅ Deployment Checklist

### Before Deploying to Production:
- [ ] Database migrations executed successfully
- [ ] Environment variables configured
- [ ] JWT secret changed from default
- [ ] CORS configured for production domain
- [ ] HTTPS enabled
- [ ] DNS configured
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Team trained on using the system
- [ ] Test credentials removed/disabled
- [ ] Production user accounts created
- [ ] Email sent to Veronika with onboarding instructions

---

**Created by:** Claude Code
**Date:** 2025-11-05
**Branch:** claude/code-session-011CUnzhY9P4xJpJosGiWAmn
**Version:** Bali Zero Tax Platform v1.0.0 (Phase 1)
