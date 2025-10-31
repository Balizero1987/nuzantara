# 🎯 Setup Grafana Cloud - Action Required

## Step 1: Create Account (5 min)

1. Go to: **https://grafana.com/auth/sign-up**
2. Sign up with your email
3. Select **Free Forever** plan
4. Create stack name: `nuzantara-prod`
5. Region: `us-east-1` (or closest to Fly.io)

## Step 2: Get Loki Credentials (2 min)

Once logged in:

1. Click **Connections** in sidebar
2. Click **Add new connection**
3. Search for **Loki**
4. Click **Loki** → **Via Grafana Alloy, Promtail, or API**
5. You'll see:
   ```
   URL: https://logs-prod-XXX.grafana.net/loki/api/v1/push
   User: 123456
   ```
6. Click **Generate now** for API Key
7. Copy all 3 values

## Step 3: Add to Fly.io (3 min)

In Fly.io dashboard:

1. Select **backend-ts** service
2. Go to **Variables**
3. Add these 3 variables:
   ```
   GRAFANA_LOKI_URL=https://logs-prod-XXX.grafana.net
   GRAFANA_LOKI_USER=123456
   GRAFANA_API_KEY=glc_xxxxxxxxxxxxxxxxxxxxx
   ```
4. Click **Deploy**

## Step 4: Verify (1 min)

Wait 2-3 minutes for deploy, then:

1. Fly.io logs should show: `✅ Grafana Loki transport enabled`
2. In Grafana Cloud → **Explore** → Select **Loki**
3. Query: `{service="backend-ts"}`
4. You should see logs appear!

## Step 5: Import Dashboard (5 min)

1. In Grafana → **Dashboards** → **New** → **Import**
2. Import ID: **15516** (Node.js Application Dashboard)
3. Select **Loki** as data source
4. Click **Import**

---

**Total time**: 15 minutes  
**Cost**: $0/month (free tier)

Once done, tell me "grafana done" and I'll continue with Qdrant!
