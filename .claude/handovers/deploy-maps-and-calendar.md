# Deploy Maps & Calendar Handover

> **What This Tracks**: Google Maps API secret mounting + Calendar ID configuration
> **Created**: 2025-10-07 by sonnet-4.5_m2

---

## 🎯 Objective

Mount Google Maps API secret and configure Calendar ID in production Cloud Run service to enable:
- `maps.directions` handler (Google Directions API)
- `maps.places` handler (Google Places API)
- `calendar.*` handlers (Google Calendar API)

---

## 📋 Commands for Deployment

### **1. Mount Secret + Set Calendar ID**

```bash
gcloud run services update zantara-v520-nuzantara \
  --region europe-west1 \
  --update-secrets GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
  --set-env-vars ZANTARA_CALENDAR_ID=c_7000dd5c02a3819af0774ad34d76379c506928057eff5e6540d662073aaeaaa7@group.calendar.google.com
```

**Expected output**:
```
✓ Deploying new service... Done.
✓ Routing traffic... Done.
Service [zantara-v520-nuzantara] revision [zantara-v520-nuzantara-00XXX-xxx] has been deployed.
```

---

### **2. Enable Required Google APIs**

```bash
gcloud services enable directions.googleapis.com places.googleapis.com
```

**Note**: Calendar API should already be enabled (used by calendar.* handlers)

---

### **3. Run STRICT Test Suite**

```bash
STRICT_MAPS=true \
API_URL=https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app \
API_KEY=zantara-internal-dev-key-2025 \
node scripts/tests/test-critical-handlers.cjs
```

**Expected result**:
```
✅ 16/16 tests passed
✅ maps.directions: 200 (valid route returned)
✅ maps.places: 200 (valid place details returned)
✅ calendar.*: 200 (all calendar operations working)
```

---

## 🔧 Configuration Details

### **Environment Variables**

| Variable | Value | Purpose |
|----------|-------|---------|
| `GOOGLE_MAPS_API_KEY` | (secret: `google-maps-api-key:latest`) | Google Maps Directions + Places API |
| `ZANTARA_CALENDAR_ID` | `c_7000dd5c02a3819af0774ad34d76379c506928057eff5e6540d662073aaeaaa7@group.calendar.google.com` | Target calendar for events |

### **Secret Details**

- **Name**: `google-maps-api-key`
- **Version**: `latest` (auto-updates)
- **Project**: `involuted-box-469105-r0`
- **Mount as**: Environment variable (not volume)

---

## 🔄 Rollback Instructions

If deployment causes issues:

```bash
# Remove secret mount + env var
gcloud run services update zantara-v520-nuzantara \
  --region europe-west1 \
  --remove-secrets GOOGLE_MAPS_API_KEY \
  --remove-env-vars ZANTARA_CALENDAR_ID

# Or: rollback to previous revision
gcloud run services update-traffic zantara-v520-nuzantara \
  --region europe-west1 \
  --to-revisions PREVIOUS_REVISION=100
```

---

## 🌐 Alternative: Console UI

If you prefer using Google Cloud Console:

1. Go to: https://console.cloud.google.com/run/detail/europe-west1/zantara-v520-nuzantara
2. Click **"EDIT & DEPLOY NEW REVISION"**
3. **Secrets** tab:
   - Click **"REFERENCE A SECRET"**
   - Secret: `google-maps-api-key`
   - Version: `latest`
   - Expose as: **Environment variable**
   - Name: `GOOGLE_MAPS_API_KEY`
4. **Variables & Secrets** tab:
   - Add variable: `ZANTARA_CALENDAR_ID`
   - Value: `c_7000dd5c02a3819af0774ad34d76379c506928057eff5e6540d662073aaeaaa7@group.calendar.google.com`
5. Click **"DEPLOY"**

---

## ✅ Verification Checklist

After deployment:

- [ ] Cloud Run revision deployed successfully
- [ ] Traffic routed to new revision (100%)
- [ ] Secret `GOOGLE_MAPS_API_KEY` visible in env vars (Console → Variables tab)
- [ ] `ZANTARA_CALENDAR_ID` present in env vars
- [ ] APIs enabled: `directions.googleapis.com`, `places.googleapis.com`
- [ ] STRICT test suite: 16/16 passed
- [ ] `maps.directions` returns 200 with valid route
- [ ] `maps.places` returns 200 with valid place details
- [ ] `calendar.*` handlers operational

---

## 📝 Related Files

**Handlers requiring these configs**:
- `src/handlers/maps/directions.ts` → requires `GOOGLE_MAPS_API_KEY`
- `src/handlers/maps/places.ts` → requires `GOOGLE_MAPS_API_KEY`
- `src/handlers/calendar/*.ts` → requires `ZANTARA_CALENDAR_ID`

**Test suite**:
- `scripts/tests/test-critical-handlers.cjs` → STRICT mode validates all handlers

---

## 🚧 Known Issues

None currently. If Maps API quota is exceeded:
- Check billing account is active
- Verify API quotas in Console → APIs & Services → Quotas
- Consider enabling billing alerts

---

## History

### 2025-10-07 18:45 (deploy-maps-calendar) [sonnet-4.5_m2]

**Created**:
- Initial handover document for Maps + Calendar secret deployment

**Related**:
→ Full session: [2025-10-07_sonnet-4.5_m2.md](#)

---
