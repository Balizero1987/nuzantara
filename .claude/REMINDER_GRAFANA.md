# ⚠️ REMINDER: Grafana Setup Pendente

**Data skip**: 2025-10-30 20:23 UTC
**Motivo**: Saltato per procedere con Qdrant + Redis
**Priorità**: P0.2 - Alta (ma non bloccante)

---

## 📋 Todo: Setup Grafana Cloud (15 minuti)

### Step 1: Create Account
- URL: https://grafana.com/auth/sign-up
- Plan: Free Forever (50GB logs/month)
- Stack name: nuzantara-prod

### Step 2: Get Credentials
- Connections → Loki → Get credentials
- Copy: URL, User ID, API Key

### Step 3: Add to Railway
Backend-ts service → Variables:
```
GRAFANA_LOKI_URL=https://logs-prod-XXX.grafana.net
GRAFANA_LOKI_USER=123456
GRAFANA_API_KEY=glc_xxxxx
```

### Step 4: Verify
- Railway redeploys automatically
- Check logs: "✅ Grafana Loki transport enabled"
- Grafana Explore: {service="backend-ts"}

---

## ✅ Already Done (Ready to Use)
- winston-loki installed
- Logger integration complete
- Code committed and pushed
- Railway auto-deploys when you add variables

---

## 🎯 Benefits When Completed
- Centralized logging (all services)
- Log search with LogQL
- Pre-built dashboards
- Automated alerts
- 14-day retention
- $0/month cost

---

**Next AI Session**: Ask "setup grafana" to get guided walkthrough
**Urgency**: Do within 1 week (recommended)
**Blocker**: No (system works without, but no centralized logs)

🔔 **REMINDER ATTIVO** - Setup Grafana quando hai 15 minuti!
