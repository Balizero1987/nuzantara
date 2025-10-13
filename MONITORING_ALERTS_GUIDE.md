# 🚨 Error Alerting System - Setup Guide

**Status**: ✅ Implemented (2025-10-09)
**Location**: `src/middleware/monitoring.ts`

---

## 📋 Overview

Automatic alert system that monitors 4xx/5xx errors and sends notifications when thresholds are exceeded.

### **Features**:
- ✅ Separate tracking for 4xx vs 5xx errors
- ✅ Error rate monitoring (percentage of failed requests)
- ✅ Configurable thresholds via environment variables
- ✅ Alert cooldown to prevent spam
- ✅ Multiple notification channels (Console, WhatsApp)
- ✅ Rolling time window (default: 5 minutes)

---

## 🔧 Configuration

### **Environment Variables**:

```bash
# Enable/disable alerting system
ALERTS_ENABLED=true

# Error thresholds (trigger alert when exceeded)
ALERT_THRESHOLD_4XX=10          # Number of 4xx errors in window
ALERT_THRESHOLD_5XX=5           # Number of 5xx errors in window
ALERT_THRESHOLD_ERROR_RATE=15   # Error rate percentage (15 = 15%)

# Time windows (in milliseconds)
ALERT_WINDOW_MS=300000          # 5 minutes (rolling window)
ALERT_COOLDOWN_MS=300000        # 5 minutes (min time between alerts)

# Notification channels
ALERT_WHATSAPP=true             # Send WhatsApp notifications
ALERT_WHATSAPP_NUMBER=+6281338051876  # WhatsApp number for alerts
```

---

## 📊 Alert Types

### **1. 4XX_THRESHOLD_EXCEEDED**
Triggered when 4xx errors exceed threshold within time window.

**Example**:
```
Count: 11 errors
Threshold: 10 errors
Window: 5 minutes
Error Rate: 18%
```

### **2. 5XX_THRESHOLD_EXCEEDED**
Triggered when 5xx errors exceed threshold within time window.

**Example**:
```
Count: 6 errors
Threshold: 5 errors
Window: 5 minutes
Error Rate: 12%
```

### **3. ERROR_RATE_EXCEEDED**
Triggered when overall error rate exceeds threshold (requires min 10 requests).

**Example**:
```
Total Requests: 50
Errors: 12 (4xx: 7, 5xx: 5)
Error Rate: 24%
Threshold: 15%
```

---

## 🔌 Integration

### **Automatic Tracking**

The alert system is **automatically integrated** into the request tracker middleware:

**File**: `src/middleware/monitoring.ts:86`

```typescript
if (isError) {
  metrics.errors++;
  const errorType = `${statusCode}xx`;
  metrics.errorsByType.set(errorType, (metrics.errorsByType.get(errorType) || 0) + 1);

  // Track error for alerting system
  trackErrorForAlert(statusCode);  // ← Automatically called
}
```

**No manual tracking needed!** All HTTP errors (4xx/5xx) are automatically monitored.

---

## 📡 Notification Channels

### **1. Console (Always Active)**
```
🚨 ALERT [5XX_THRESHOLD_EXCEEDED]: 5xx errors exceeded threshold (6 >= 5)
📊 Details: {
  "count4xx": 3,
  "count5xx": 6,
  "totalRequests": 45,
  "errorRate": "20%",
  "windowMinutes": 5,
  "threshold": 5
}
```

### **2. WhatsApp (Optional)**
**Format**:
```
🚨 *ZANTARA ALERT*

*Type:* 5XX_THRESHOLD_EXCEEDED
*Message:* 5xx errors exceeded threshold (6 >= 5)

*Details:*
{
  "count4xx": 3,
  "count5xx": 6,
  "totalRequests": 45,
  "errorRate": "20%",
  "windowMinutes": 5,
  "threshold": 5
}
```

**Enable**:
```bash
ALERT_WHATSAPP=true
ALERT_WHATSAPP_NUMBER=+6281338051876
```

---

## 🔍 Monitoring

### **Alert Status Endpoint**

**GET** `/alerts/status`

**Response**:
```json
{
  "ok": true,
  "data": {
    "enabled": true,
    "config": {
      "thresholds": {
        "error4xx": 10,
        "error5xx": 5,
        "errorRate": 15
      },
      "window": 300000,
      "cooldown": 300000,
      "channels": {
        "whatsapp": true,
        "console": true
      }
    },
    "currentWindow": {
      "count4xx": 3,
      "count5xx": 1,
      "totalRequests": 127,
      "errorRate": "3%",
      "windowStarted": "2025-10-09T02:15:30.123Z",
      "windowElapsedMs": 124567
    },
    "lastAlert": {
      "type": "5XX_THRESHOLD_EXCEEDED",
      "timestamp": "2025-10-09T02:10:15.456Z",
      "timeSinceMs": 315000
    }
  }
}
```

---

## 🎯 How It Works

### **1. Error Detection**
Every HTTP response is checked in `requestTracker` middleware:
```typescript
const statusCode = res.statusCode;
const isError = statusCode >= 400;

if (isError) {
  trackErrorForAlert(statusCode);  // Track for alerts
}
```

### **2. Metrics Tracking**
Errors are accumulated in a rolling time window:
```typescript
alertMetrics.totalRequests++;

if (statusCode >= 400 && statusCode < 500) {
  alertMetrics.count4xx++;
} else if (statusCode >= 500) {
  alertMetrics.count5xx++;
}
```

### **3. Threshold Checking**
After each error, thresholds are checked asynchronously:
```typescript
// Check 4xx threshold
if (alertMetrics.count4xx >= alertConfig.thresholds.error4xx) {
  await sendAlert('4XX_THRESHOLD_EXCEEDED', message, details);
}

// Check 5xx threshold
if (alertMetrics.count5xx >= alertConfig.thresholds.error5xx) {
  await sendAlert('5XX_THRESHOLD_EXCEEDED', message, details);
}

// Check error rate
const errorRate = (count4xx + count5xx) / totalRequests * 100;
if (errorRate >= alertConfig.thresholds.errorRate) {
  await sendAlert('ERROR_RATE_EXCEEDED', message, details);
}
```

### **4. Alert Cooldown**
Prevents alert spam by enforcing minimum time between alerts:
```typescript
const timeSinceLastAlert = Date.now() - alertMetrics.lastAlertTime;

if (timeSinceLastAlert < alertConfig.cooldown) {
  console.log('⏳ Alert cooldown active...');
  return; // Skip alert
}
```

### **5. Window Reset**
Metrics are reset after the time window expires:
```typescript
if (windowElapsed > alertConfig.window) {
  alertMetrics.count4xx = 0;
  alertMetrics.count5xx = 0;
  alertMetrics.totalRequests = 0;
  alertMetrics.windowStart = Date.now();
}
```

---

## 🧪 Testing

### **Manual Test (Local)**

1. **Enable alerts**:
```bash
export ALERTS_ENABLED=true
export ALERT_THRESHOLD_5XX=3
export ALERT_WINDOW_MS=60000
export ALERT_COOLDOWN_MS=10000
```

2. **Start server**:
```bash
npm run dev
```

3. **Trigger 5xx errors** (hit non-existent endpoint 4 times):
```bash
for i in {1..4}; do curl http://localhost:8080/trigger-error-test; done
```

4. **Check alert status**:
```bash
curl http://localhost:8080/alerts/status
```

### **Expected Behavior**:
- After 3rd error: Alert triggered (console log)
- 4th error: Alert cooldown active (no duplicate alert)
- After cooldown expires: New alert can be sent

---

## 📈 Production Setup

### **Cloud Run Environment**

Update Cloud Run service with alert configuration:

```bash
gcloud run services update zantara-v520-nuzantara \
  --region=europe-west1 \
  --set-env-vars="
    ALERTS_ENABLED=true,
    ALERT_THRESHOLD_4XX=20,
    ALERT_THRESHOLD_5XX=10,
    ALERT_THRESHOLD_ERROR_RATE=15,
    ALERT_WINDOW_MS=300000,
    ALERT_COOLDOWN_MS=300000,
    ALERT_WHATSAPP=true,
    ALERT_WHATSAPP_NUMBER=+6281338051876
  "
```

### **Recommended Production Thresholds**:

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| 4xx errors | 20 per 5min | Allows some client errors without spam |
| 5xx errors | 10 per 5min | Server errors are critical - lower threshold |
| Error rate | 15% | Alert if >15% requests fail |
| Window | 5 minutes | Balance between responsiveness and noise |
| Cooldown | 5 minutes | Prevent alert fatigue |

---

## 🔒 Security Considerations

1. **WhatsApp Number**: Store in Secret Manager (not env vars)
2. **Alert Content**: Never include sensitive data in alerts
3. **Rate Limiting**: Cooldown prevents DoS via alert spam
4. **Authentication**: Alert endpoint is public (read-only, safe)

---

## 🐛 Troubleshooting

### **Alerts Not Triggering**

**Check**:
1. `ALERTS_ENABLED=true` set?
2. Thresholds configured correctly?
3. Errors actually occurring (check `/metrics`)?
4. Within cooldown period (check `/alerts/status`)?

**Debug**:
```bash
# Check current alert status
curl http://localhost:8080/alerts/status

# Check metrics
curl http://localhost:8080/metrics
```

### **WhatsApp Alerts Not Sending**

**Check**:
1. `ALERT_WHATSAPP=true` set?
2. `ALERT_WHATSAPP_NUMBER` valid?
3. WhatsApp handler configured (Meta access token)?
4. Console shows "✅ WhatsApp alert sent" or error?

---

## 📝 Future Improvements

- [ ] Add Slack/Discord webhook support
- [ ] Email notifications
- [ ] Custom alert rules (e.g., specific endpoint errors)
- [ ] Alert history persistence (Firestore)
- [ ] Grafana/Prometheus integration
- [ ] Alert acknowledgment/muting

---

**Implementation Date**: 2025-10-09
**Author**: Claude Sonnet 4.5
**Status**: ✅ Production Ready
