# 🔐 Security Guide

**Security best practices and hardening checklist**

**Last Updated:** October 23, 2025

---

## 🎯 Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimum necessary permissions
3. **Zero Trust** - Verify everything, trust nothing
4. **Audit Everything** - Log all security-relevant events

---

## 🔑 Authentication & Authorization

### JWT Token Security

**Current Implementation:**
```typescript
// JWT-based authentication
// Token includes: uid, email, role, permissions
// Expiry: 24 hours
// Algorithm: RS256 (asymmetric)
```

**Best Practices:**

✅ **DO:**
- Use short-lived tokens (current: 24h, consider: 1-2h)
- Rotate refresh tokens regularly
- Validate token signature on every request
- Check token expiry
- Verify user still exists and is active

❌ **DON'T:**
- Store tokens in localStorage (use httpOnly cookies)
- Share tokens between users
- Log full token values
- Trust client-provided tokens without verification

**Token Validation:**
```typescript
// apps/backend-ts/src/middleware/auth.ts

export async function validateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify signature
    const decoded = await verifyJWT(token);

    // Check expiry
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Check user still active
    const user = await db.query(
      'SELECT uid, email, role, active FROM users WHERE uid = $1',
      [decoded.uid]
    );

    if (!user.rows[0] || !user.rows[0].active) {
      return res.status(401).json({ error: 'User inactive' });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    logger.error('Token validation failed', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

### Role-Based Access Control (RBAC)

**Roles:**
- `admin` - Full access to all handlers and data
- `team_member` - Access to team tools (120 handlers)
- `demo` - Public access (25 handlers)

**Handler Authorization:**
```typescript
globalRegistry.registerModule('admin-tools', {
  'user.delete': deleteUser,
  'system.config': updateConfig
}, {
  requiresAuth: true,
  requiredRoles: ['admin']  // ← Only admins
});

globalRegistry.registerModule('team-tools', {
  'analytics.view': viewAnalytics
}, {
  requiresAuth: true,
  requiredRoles: ['admin', 'team_member']  // ← Admin or team
});

globalRegistry.registerModule('public', {
  'pricing.get': getPricing
}, {
  requiresAuth: false  // ← Public access
});
```

---

## 🔒 API Key Management

### Environment Variables Security

**✅ Secure Storage:**
- Store in Railway environment variables (encrypted at rest)
- Never commit to git (use `.env.example` templates)
- Rotate keys every 90 days

**Current Keys:**
```bash
# Required keys (Railway environment variables)
ANTHROPIC_API_KEY=sk-ant-...           # Claude Haiku API
DATABASE_URL=postgresql://...          # PostgreSQL connection
FIREBASE_SERVICE_ACCOUNT={"type":...}  # Firebase admin
RUNPOD_API_KEY=...                     # ZANTARA Llama
TWILIO_ACCOUNT_SID=...                 # WhatsApp/SMS
GOOGLE_CLIENT_SECRET=...               # Google Workspace OAuth
```

**Rotation Schedule:**

| Key | Rotation Frequency | Next Rotation |
|-----|-------------------|---------------|
| `ANTHROPIC_API_KEY` | 90 days | 2026-01-20 |
| `FIREBASE_SERVICE_ACCOUNT` | 180 days | 2026-04-15 |
| `RUNPOD_API_KEY` | 90 days | 2026-01-20 |
| `TWILIO_ACCOUNT_SID` | 180 days | 2026-04-15 |
| `DATABASE_URL` | On incident only | N/A |

**Rotation Procedure:**
```bash
# 1. Generate new key at provider
# 2. Add new key to Railway (don't replace yet)
ANTHROPIC_API_KEY_NEW=sk-ant-new...

# 3. Test with new key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY_NEW" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-haiku-4.5-20250929", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'

# 4. Update Railway variable
railway variables --service "RAG BACKEND" set ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY_NEW

# 5. Redeploy
railway up --service "RAG BACKEND"

# 6. Verify production works
curl https://rag-backend.railway.app/health

# 7. Delete old key at provider
```

---

## 🛡️ Data Security

### Encryption at Rest

**Database:**
- ✅ PostgreSQL encryption enabled by Railway
- ✅ Automated encrypted backups daily
- ✅ SSL/TLS connections enforced

**Sensitive Data:**
```typescript
// Encrypt sensitive fields before storing
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

// Usage: Encrypt before saving
const { encrypted, iv, tag } = encrypt(sensitiveData);
await db.query(
  'INSERT INTO secrets (user_id, encrypted_value, iv, tag) VALUES ($1, $2, $3, $4)',
  [userId, encrypted, iv, tag]
);
```

### Encryption in Transit

**✅ Enforced:**
- All Railway services use HTTPS (TLS 1.3)
- Database connections use SSL (`?sslmode=require`)
- Internal service-to-service uses HTTPS

**Configuration:**
```bash
# PostgreSQL connection with SSL
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Verify TLS version
openssl s_client -connect ts-backend-production-568d.up.railway.app:443 \
  -tls1_3 -showcerts
```

---

## 📝 Audit Logging

### What to Log

**✅ Security Events:**
- Authentication attempts (success/failure)
- Authorization failures
- API key usage
- Admin actions
- Data access (sensitive tables)
- Configuration changes

**Implementation:**
```typescript
// apps/backend-ts/src/middleware/audit-log.ts

export function auditLog(action: string, details: any) {
  logger.info('AUDIT', {
    action,
    timestamp: new Date().toISOString(),
    user: req.user?.uid || 'anonymous',
    ip: req.ip,
    user_agent: req.headers['user-agent'],
    ...details
  });

  // Also save to database for compliance
  db.query(
    `INSERT INTO audit_logs (action, user_id, ip_address, details, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [action, req.user?.uid, req.ip, JSON.stringify(details)]
  );
}

// Usage
export async function deleteUser(params: any, req?: any) {
  auditLog('user.delete', {
    target_user_id: params.user_id,
    reason: params.reason
  });

  await db.query('DELETE FROM users WHERE uid = $1', [params.user_id]);
  return ok({ deleted: true });
}
```

**Query Audit Logs:**
```bash
# Recent admin actions
railway run psql $DATABASE_URL -c "
SELECT created_at, action, user_id, details
FROM audit_logs
WHERE action LIKE 'admin.%'
ORDER BY created_at DESC
LIMIT 50;
"

# Failed authentication attempts
railway run psql $DATABASE_URL -c "
SELECT created_at, user_id, ip_address
FROM audit_logs
WHERE action = 'auth.failed'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
"
```

---

## 🚨 Security Incidents

### Incident Types

**1. Compromised API Key**
```bash
# Immediate action:
1. Revoke key at provider immediately
2. Check audit logs for unauthorized usage
3. Generate new key
4. Update Railway env var
5. Redeploy affected services
6. Monitor for continued abuse

# Investigation:
railway logs --service "RAG BACKEND" --since 24h | \
  grep ANTHROPIC_API_KEY | \
  jq -r '{timestamp, user, ip, action}'
```

**2. Unauthorized Access**
```bash
# Immediate action:
1. Disable affected user account
2. Revoke all active tokens
3. Check audit logs for actions taken
4. Assess data accessed/modified
5. Notify affected users if needed

# Investigation:
railway run psql $DATABASE_URL -c "
UPDATE users SET active = false WHERE uid = 'compromised_user';
DELETE FROM active_sessions WHERE user_id = 'compromised_user';
SELECT * FROM audit_logs WHERE user_id = 'compromised_user' ORDER BY created_at DESC LIMIT 100;
"
```

**3. Data Breach**
```bash
# Immediate action:
1. Identify scope of breach (what data, how many users)
2. Contain breach (close vulnerability)
3. Notify users within 72 hours (GDPR requirement)
4. Report to authorities if required
5. Document incident

# Legal requirements (GDPR):
- Notify authorities within 72 hours
- Notify affected users "without undue delay"
- Document: nature, consequences, measures taken
```

---

## ✅ Security Checklist

### Pre-Deployment Security

- [ ] No secrets in code/git history
- [ ] All API keys in Railway environment variables
- [ ] JWT token validation working
- [ ] Role-based access control enforced
- [ ] Audit logging enabled for admin actions
- [ ] Database SSL connections enforced
- [ ] HTTPS/TLS enforced (Railway default)
- [ ] Input validation on all handlers
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting enabled
- [ ] CORS configured correctly

### Monthly Security Review

- [ ] Rotate API keys (if due)
- [ ] Review audit logs for anomalies
- [ ] Check for dependency vulnerabilities (`npm audit`, `pip-audit`)
- [ ] Review user access levels
- [ ] Verify backup recovery works
- [ ] Check SSL certificate expiry
- [ ] Review rate limit effectiveness

### Quarterly Security Audit

- [ ] Full security assessment
- [ ] Penetration testing (if budget allows)
- [ ] Review all authentication flows
- [ ] Update security documentation
- [ ] Train team on security best practices
- [ ] Review incident response procedures

---

## 🔍 Vulnerability Management

### Dependency Scanning

```bash
# Node.js dependencies
cd apps/backend-ts
npm audit
npm audit fix  # Auto-fix non-breaking vulnerabilities

# Python dependencies
cd apps/backend-rag/backend
pip-audit
pip install --upgrade <vulnerable-package>
```

**Automated Checks:**
- GitHub Dependabot (enabled, auto-PR for updates)
- Weekly npm audit in CI/CD
- Critical vulnerabilities = immediate patch

---

## 📞 Security Contacts

**Internal:**
- Security Lead: [Your CTO/Lead Developer]
- On-Call Engineer: [Rotation schedule]

**External:**
- Railway Support: https://help.railway.app
- Anthropic Security: security@anthropic.com
- GDPR DPO: [If applicable]

---

## 🔗 Related Documentation

- **Incident Response**: [Incident Response Playbook](../operations/INCIDENT_RESPONSE.md)
- **Monitoring**: [Monitoring Guide](../operations/MONITORING_GUIDE.md)
- **Deployment**: [Railway Deployment Guide](../guides/RAILWAY_DEPLOYMENT_GUIDE.md)

---

**Security is everyone's responsibility.** 🔐
