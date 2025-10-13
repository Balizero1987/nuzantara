# Complaint Management System

Sistema completo per la gestione dei reclami relativi a subscription, usage, billing e servizi.

## 🎯 Caratteristiche Principali

- **Classificazione Automatica della Gravità**: I reclami vengono automaticamente classificati come `critical`, `high`, `medium`, o `low` in base al contenuto e ai metadati
- **Auto-escalation**: I reclami critici vengono automaticamente escalati al team senior
- **Notifiche Real-time**: Notifiche immediate per reclami critici e ad alta priorità
- **Tracking Completo**: Gestione dello stato del reclamo dal submission alla risoluzione
- **Analytics**: Statistiche e metriche sui reclami per identificare pattern e problemi ricorrenti

## 📋 Tipi di Reclami Supportati

- `subscription` - Problemi relativi all'abbonamento
- `usage` - Problemi relativi ai limiti di utilizzo
- `billing` - Problemi di fatturazione e pagamento
- `service` - Problemi tecnici o di funzionalità
- `other` - Altri tipi di reclami

## 🚨 Livelli di Gravità

### Critical
- **Keywords**: scam, truffa, fraud, frode, unauthorized, stolen, legal action
- **Response Time**: 1 hour
- **Auto-escalation**: Yes
- **Notification**: Immediate to senior support team

### High
- **Keywords**: urgent, immediately, paid but, not working, lost access, just paid
- **Conditions**: Payment within last 24h + usage issues
- **Response Time**: 2-4 hours
- **Notification**: Yes

### Medium
- **Keywords**: billing, payment issues
- **Response Time**: 24 hours
- **Notification**: No

### Low
- **Default**: General inquiries and minor issues
- **Response Time**: 2-3 business days
- **Notification**: No

## 🔌 API Endpoints

### POST /complaint.submit
Sottometti un nuovo reclamo.

**Request Body:**
```json
{
  "userId": "user123",
  "type": "subscription",
  "subject": "Usage warning after payment",
  "description": "I paid $60 2 hours ago for PRO+ but received usage warning",
  "metadata": {
    "subscriptionPlan": "PRO+",
    "paymentAmount": 60,
    "paymentDate": "2025-10-13T10:00:00Z",
    "usagePercentage": 95,
    "expectedBehavior": "Full quota reset",
    "actualBehavior": "Received usage warning"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "complaintId": "COMPLAINT-1697123456-1",
    "status": "submitted",
    "severity": "critical",
    "message": "Your complaint has been marked as CRITICAL and escalated...",
    "estimatedResponseTime": "1 hour",
    "nextSteps": [
      "Our team will verify your subscription status",
      "We will review your payment history",
      "You will receive account access confirmation or refund if applicable"
    ]
  }
}
```

### GET /complaint.get?complaintId=xxx
Recupera i dettagli di un reclamo specifico.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "COMPLAINT-1697123456-1",
    "userId": "user123",
    "type": "subscription",
    "severity": "critical",
    "subject": "Usage warning after payment",
    "description": "...",
    "status": "escalated",
    "createdAt": "2025-10-13T12:00:00Z",
    "updatedAt": "2025-10-13T12:05:00Z",
    "metadata": { ... },
    "notes": [
      "2025-10-13T12:05:00Z: ESCALATED - Auto-escalated due to critical severity"
    ]
  }
}
```

### POST /complaint.update
Aggiorna lo stato di un reclamo (solo team support).

**Request Body:**
```json
{
  "complaintId": "COMPLAINT-1697123456-1",
  "status": "investigating",
  "note": "Team is reviewing the billing records",
  "assignedTo": "support@balizero.com"
}
```

### GET /complaint.list
Lista tutti i reclami con filtri opzionali.

**Query Parameters:**
- `type` - Filtra per tipo (subscription, usage, billing, service, other)
- `severity` - Filtra per gravità (critical, high, medium, low)
- `status` - Filtra per stato (new, acknowledged, investigating, resolved, escalated)
- `userId` - Filtra per utente
- `limit` - Numero massimo di risultati (default: 50)
- `offset` - Offset per paginazione (default: 0)

**Example:**
```
GET /complaint.list?severity=critical&status=new&limit=10
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "complaints": [ ... ],
    "pagination": {
      "total": 45,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### GET /complaint.stats?period=7d
Ottieni statistiche sui reclami.

**Query Parameters:**
- `period` - Periodo di analisi (24h, 7d, 30d)

**Response:**
```json
{
  "ok": true,
  "data": {
    "total": 127,
    "byType": {
      "subscription": 45,
      "usage": 32,
      "billing": 28,
      "service": 15,
      "other": 7
    },
    "bySeverity": {
      "critical": 12,
      "high": 34,
      "medium": 56,
      "low": 25
    },
    "byStatus": {
      "new": 23,
      "acknowledged": 15,
      "investigating": 42,
      "resolved": 38,
      "escalated": 9
    },
    "averageResolutionTime": 43200000,
    "escalationRate": 7.08
  }
}
```

## 🔧 Utilizzo Programmatico

### Submit Complaint via Handler
```typescript
import { submitComplaint } from './handlers/support/complaint-handler';

const result = await submitComplaint({
  userId: 'user123',
  type: 'subscription',
  subject: 'Issue with PRO+ subscription',
  description: 'Detailed description of the issue',
  metadata: {
    subscriptionPlan: 'PRO+',
    paymentAmount: 60,
    paymentDate: new Date().toISOString()
  }
});

console.log('Complaint ID:', result.data.complaintId);
console.log('Severity:', result.data.severity);
```

### Integrate with Notification Systems

Il sistema include già logging console. Per integrare con sistemi esterni (email, Slack, Jira), modifica la funzione `notifySupport` in `complaint-handler.ts`:

```typescript
async function notifySupport(complaint: Complaint) {
  // Email notification
  await sendEmail({
    to: 'support@balizero.com',
    subject: `[${complaint.severity.toUpperCase()}] ${complaint.subject}`,
    body: generateEmailBody(complaint)
  });

  // Slack notification
  if (complaint.severity === 'critical' || complaint.severity === 'high') {
    await slackNotify({
      channel: '#support-urgent',
      message: formatSlackMessage(complaint)
    });
  }

  // Create Jira ticket for critical issues
  if (complaint.severity === 'critical') {
    await createJiraTicket({
      project: 'SUPPORT',
      priority: 'Highest',
      summary: complaint.subject,
      description: complaint.description
    });
  }
}
```

## 📊 Best Practices

### 1. Monitoring
- Controllare regolarmente `/complaint.stats` per identificare trend
- Monitorare l'escalation rate (target: < 10%)
- Tracciare il tempo medio di risoluzione

### 2. Response Times
- **Critical**: Max 1 hour response
- **High**: Max 4 hours response
- **Medium**: Max 24 hours response
- **Low**: Max 72 hours response

### 3. Escalation Triggers
- Auto-escalate se:
  - Severity = critical
  - High severity non risolto in 8 ore
  - Medium severity non risolto in 48 ore
  - Più di 2 reclami dallo stesso utente in 24h

### 4. Data Retention
```typescript
// Archivia reclami risolti dopo 90 giorni
// Mantieni reclami critici per 1 anno per analisi
const RETENTION_POLICY = {
  resolved: 90, // days
  critical: 365, // days
  escalated: 180 // days
};
```

## 🧪 Testing

Il sistema include test completi in `__tests__/complaint-handler.test.ts`:

```bash
# Run complaint handler tests
npm test -- complaint-handler.test.ts

# Run with coverage
npm test -- --coverage complaint-handler.test.ts
```

## 🔐 Security Considerations

1. **API Key Required**: Tutti gli endpoint richiedono autenticazione via API key
2. **Data Privacy**: I reclami contengono dati sensibili degli utenti
3. **Access Control**: Implementare role-based access per update e stats
4. **Audit Trail**: Tutti gli aggiornamenti vengono loggati nel campo `notes`

## 📈 Metrics & KPIs

### Key Metrics to Track
- **Volume**: Total complaints per period
- **Response Time**: Average time to first response
- **Resolution Time**: Average time to resolve
- **Escalation Rate**: % of complaints escalated
- **Customer Satisfaction**: Post-resolution survey scores

### Alert Thresholds
```typescript
const ALERT_THRESHOLDS = {
  escalationRate: 15, // Alert if > 15%
  criticalUnresolved: 5, // Alert if 5+ critical unresolved
  averageResponseTime: 7200000, // Alert if > 2 hours (in ms)
  volumeSpike: 50 // Alert if 50% increase in 24h
};
```

## 🚀 Future Enhancements

1. **AI-Powered Classification**: Use ML to improve severity classification
2. **Sentiment Analysis**: Detect customer frustration levels
3. **Auto-Response**: Template-based auto-responses for common issues
4. **SLA Management**: Automatic tracking of SLA compliance
5. **Knowledge Base Integration**: Link to relevant KB articles
6. **Multi-language Support**: Auto-detect and respond in customer's language
7. **Webhook Integration**: Real-time webhooks for external systems

## 📞 Support Team Contact

Per supporto tecnico sul sistema di gestione reclami:
- **Email**: tech@balizero.com
- **Slack**: #support-system
- **Docs**: https://docs.balizero.com/complaint-system

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-13  
**Maintainer**: Bali Zero Tech Team
