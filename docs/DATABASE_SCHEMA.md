# NUZANTARA Database Schema

**Version:** 5.2.0  
**Last Updated:** 2025-11-07

---

## PostgreSQL Schema

### Core CRM Tables

#### 1. team_members

```sql
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  phone VARCHAR(50),
  active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_active ON team_members(active);
```

#### 2. clients

```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  nationality VARCHAR(100),
  passport_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  client_type VARCHAR(50) DEFAULT 'individual',
  assigned_to INTEGER REFERENCES team_members(id),
  first_contact_date TIMESTAMP,
  last_interaction_date TIMESTAMP,
  address TEXT,
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_uuid ON clients(uuid);
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);
```

#### 3. practice_types

```sql
CREATE TABLE practice_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  base_price DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'IDR',
  duration_days INTEGER,
  required_documents TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default practice types
INSERT INTO practice_types (code, name, category, base_price, duration_days) VALUES
('KITAS', 'KITAS Limited Stay', 'Immigration', 15000000, 90),
('PT_PMA', 'PT PMA Company Setup', 'Corporate', 50000000, 120),
('INVESTOR_VISA', 'Investor KITAS', 'Immigration', 20000000, 90),
('RETIREMENT_VISA', 'Retirement KITAS', 'Immigration', 18000000, 90),
('NPWP', 'Tax ID Registration', 'Tax', 1000000, 14),
('BPJS', 'Social Security Registration', 'Labor', 500000, 7),
('IMTA', 'Work Permit', 'Immigration', 5000000, 60);
```

#### 4. practices

```sql
CREATE TABLE practices (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  practice_type_id INTEGER NOT NULL REFERENCES practice_types(id),
  status VARCHAR(50) DEFAULT 'inquiry',
  priority VARCHAR(20) DEFAULT 'normal',
  inquiry_date TIMESTAMP,
  start_date TIMESTAMP,
  completion_date TIMESTAMP,
  expiry_date TIMESTAMP,
  next_renewal_date TIMESTAMP,
  quoted_price DECIMAL(15,2),
  actual_price DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'IDR',
  payment_status VARCHAR(50) DEFAULT 'pending',
  paid_amount DECIMAL(15,2) DEFAULT 0,
  assigned_to INTEGER REFERENCES team_members(id),
  documents JSONB DEFAULT '[]',
  missing_documents TEXT[],
  notes TEXT,
  internal_notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_practices_client_id ON practices(client_id);
CREATE INDEX idx_practices_type ON practices(practice_type_id);
CREATE INDEX idx_practices_status ON practices(status);
CREATE INDEX idx_practices_assigned_to ON practices(assigned_to);
CREATE INDEX idx_practices_expiry_date ON practices(expiry_date);
```

**Status Values:**
- inquiry
- quotation_sent
- payment_pending
- in_progress
- waiting_documents
- submitted_to_gov
- approved
- completed
- cancelled

#### 5. interactions

```sql
CREATE TABLE interactions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  practice_id INTEGER REFERENCES practices(id) ON DELETE SET NULL,
  conversation_id VARCHAR(255),
  interaction_type VARCHAR(50) NOT NULL,
  channel VARCHAR(50),
  subject VARCHAR(500),
  summary TEXT,
  full_content TEXT,
  sentiment VARCHAR(20),
  team_member INTEGER REFERENCES team_members(id),
  direction VARCHAR(20),
  extracted_entities JSONB DEFAULT '{}',
  action_items TEXT[],
  interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interactions_client ON interactions(client_id);
CREATE INDEX idx_interactions_practice ON interactions(practice_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_date ON interactions(interaction_date);
```

**Interaction Types:**
- chat
- email
- whatsapp
- call
- meeting
- note

#### 6. documents

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  practice_id INTEGER REFERENCES practices(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  storage_type VARCHAR(50) DEFAULT 'google_drive',
  file_id VARCHAR(255),
  file_url TEXT,
  file_size_kb INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  uploaded_by INTEGER REFERENCES team_members(id),
  verified_by INTEGER REFERENCES team_members(id),
  verified_at TIMESTAMP,
  expiry_date TIMESTAMP,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_practice ON documents(practice_id);
CREATE INDEX idx_documents_type ON documents(document_type);
```

#### 7. renewal_alerts

```sql
CREATE TABLE renewal_alerts (
  id SERIAL PRIMARY KEY,
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  description TEXT,
  target_date TIMESTAMP NOT NULL,
  alert_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  notify_team_member INTEGER REFERENCES team_members(id),
  notify_client BOOLEAN DEFAULT true,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_renewal_alerts_date ON renewal_alerts(alert_date);
CREATE INDEX idx_renewal_alerts_status ON renewal_alerts(status);
```

#### 8. activity_log

```sql
CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  performed_by INTEGER REFERENCES team_members(id),
  changes JSONB,
  description TEXT,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_date ON activity_log(performed_at);
```

### Memory & Conversation Tables

#### 9. conversations

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);
```

#### 10. memory_facts

```sql
CREATE TABLE memory_facts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  fact_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3,2),
  source VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memory_facts_user ON memory_facts(user_id);
CREATE INDEX idx_memory_facts_type ON memory_facts(fact_type);
```

### Work Sessions & Analytics

#### 11. work_sessions

```sql
CREATE TABLE work_sessions (
  id SERIAL PRIMARY KEY,
  team_member INTEGER REFERENCES team_members(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  tasks JSONB DEFAULT '[]',
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_sessions_member ON work_sessions(team_member);
CREATE INDEX idx_work_sessions_date ON work_sessions(start_time);
```

### Oracle Knowledge Base

#### 12. oracle_knowledge_base

```sql
CREATE TABLE oracle_knowledge_base (
  id SERIAL PRIMARY KEY,
  collection_name VARCHAR(255) NOT NULL,
  document_id VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embeddings VECTOR(1536),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oracle_kb_collection ON oracle_knowledge_base(collection_name);
CREATE INDEX idx_oracle_kb_document ON oracle_knowledge_base(document_id);
```

### Database Views

#### active_practices_view

```sql
CREATE VIEW active_practices_view AS
SELECT 
  p.*,
  c.full_name AS client_name,
  c.email AS client_email,
  pt.name AS practice_type_name,
  tm.full_name AS assigned_to_name
FROM practices p
JOIN clients c ON p.client_id = c.id
JOIN practice_types pt ON p.practice_type_id = pt.id
LEFT JOIN team_members tm ON p.assigned_to = tm.id
WHERE p.status NOT IN ('completed', 'cancelled');
```

#### upcoming_renewals_view

```sql
CREATE VIEW upcoming_renewals_view AS
SELECT 
  p.*,
  c.full_name AS client_name,
  c.email AS client_email,
  pt.name AS practice_type_name,
  EXTRACT(DAY FROM (p.next_renewal_date - CURRENT_TIMESTAMP)) AS days_until_renewal
FROM practices p
JOIN clients c ON p.client_id = c.id
JOIN practice_types pt ON p.practice_type_id = pt.id
WHERE p.next_renewal_date IS NOT NULL
  AND p.next_renewal_date <= CURRENT_TIMESTAMP + INTERVAL '90 days'
  AND p.status != 'cancelled'
ORDER BY p.next_renewal_date;
```

#### client_summary_view

```sql
CREATE VIEW client_summary_view AS
SELECT 
  c.*,
  COUNT(DISTINCT p.id) AS total_practices,
  COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) AS active_practices,
  COUNT(DISTINCT i.id) AS total_interactions,
  MAX(i.interaction_date) AS last_interaction
FROM clients c
LEFT JOIN practices p ON c.id = p.client_id
LEFT JOIN interactions i ON c.id = i.client_id
GROUP BY c.id;
```

---

## ChromaDB Collections

### Collections Overview

| Collection | Documents | Purpose |
|------------|-----------|---------|
| kbli_eye | 2,145 | Indonesian business classification |
| legal_architect | 1,823 | Legal framework & regulations |
| tax_genius | 945 | Tax regulations & optimization |
| visa_oracle | 1,234 | Visa & immigration |
| property_sage | 678 | Property law & real estate |
| cultural_intelligence | 412 | Cultural context |
| bali_zero_services | 256 | Service catalog |
| immigration_law | 534 | Immigration regulations |
| corporate_law | 423 | Corporate legal framework |
| investment_regulations | 312 | Investment rules |
| property_law | 198 | Property regulations |
| tax_law | 287 | Tax legal framework |
| pp_28_2025 | 875 | PP28 regulations |

**Total Chunks:** 8,122+

### Collection Metadata Structure

```json
{
  "source": "Immigration Law 2011",
  "category": "visa_regulations",
  "language": "en",
  "chunk_id": "chunk_001",
  "timestamp": "2025-01-15T10:00:00Z",
  "confidence": 0.95
}
```

---

## Redis Data Structures

### Key Patterns

```
# Sessions
session:{sessionId} -> JSON (TTL: 24 hours)

# Auth tokens
auth:token:{token} -> JSON (TTL: 24 hours)

# Query cache
cache:query:{hash} -> JSON (TTL: 1 hour)

# Rate limiting
ratelimit:{endpoint}:{ip} -> Counter (TTL: 15 minutes)

# Handler results
handler:{handlerName}:{paramsHash} -> JSON (TTL: 30 minutes)
```

### Example Data

```redis
# Session
SET session:sess_abc123 '{"userId": "user_123", "email": "user@example.com"}'
EXPIRE session:sess_abc123 86400

# Rate limit
INCR ratelimit:/api/chat:192.168.1.1
EXPIRE ratelimit:/api/chat:192.168.1.1 900
```

---

**For more information:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [ONBOARDING.md](./ONBOARDING.md) - Developer onboarding

**Version:** 5.2.0
