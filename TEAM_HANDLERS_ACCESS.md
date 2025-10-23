# 🎯 HANDLERS ACCESS - TEAM BALI ZERO

## 📊 **OVERVIEW**:

### **Totale Handlers Sistema**: **164 handlers**

### **Distribuzione Accessi**:
- **👑 ADMIN (Zero)**: **164/164** handlers (100%)
- **👥 TEAM MEMBERS**: **~80/164** handlers (49%)
- **🌐 DEMO USERS**: **13/164** handlers (8%)

---

## 👑 **ADMIN ACCESS (ZERO)** - 164 Handlers

### **Ruoli Admin**:
- `admin`
- `AI Bridge/Tech Lead`
- `tech`

### **Permessi**: ✅ **ACCESSO COMPLETO A TUTTI I 164 HANDLERS**

**Non ci sono restrizioni per gli admin. Hai accesso a:**
- Tutti i sistemi
- Tutte le operazioni (read/write/delete)
- Dati sensibili (CRM, clients, practices)
- Operazioni admin (team create/delete, system config)
- Google Workspace completo
- Comunicazioni (Gmail, WhatsApp, Email)
- Memoria completa (save/delete)
- Analytics avanzati
- Reports generation

---

## 👥 **TEAM MEMBERS ACCESS** - ~80 Handlers

### **Ruoli Team Members**:
- `member`
- `collaborator`
- `developer`

### **Handlers Disponibili** (~80):

#### **🔧 SYSTEM & INTROSPECTION** (5):
1. `system.handlers.list` - Lista tutti gli handlers
2. `system.handlers.category` - Handlers per categoria
3. `system.handlers.get` - Dettagli handler specifico
4. `system.handlers.tools` - Tool definitions
5. `system.handler.execute` - Esegui handler generico

#### **🤖 AI SERVICES** (5):
6. `ai.chat` - Chat con AI (ZANTARA Haiku 4.5)
7. `ai.chat.stream` - Chat streaming
8. `ai-services.chat` - AI chat service
9. `ai-services.anticipate` - AI anticipation
10. `ai-services.learn` - AI learning

#### **📚 RAG & SEARCH** (4):
11. `rag.query` - Query RAG knowledge base
12. `rag.search` - Semantic search
13. `rag.health` - RAG health check
14. `bali.zero.chat` - Bali Zero specialized chat

#### **💰 PRICING (Read-only)** (5):
15. `bali.zero.pricing` - Official pricing
16. `bali.zero.price` - Quick price lookup
17. `pricing.official` - Official pricelist
18. `pricing.search` - Search pricing
19. `price.lookup` - Lookup specific price

#### **👥 TEAM MANAGEMENT** (5):
20. `team.list` - Lista team members
21. `team.members` - Team members details
22. `team.login` - Team login
23. `team.logout` - Team logout
24. `team.token.verify` - Verify JWT token

#### **🔮 ORACLE SYSTEM** (5):
25. `oracle.query` - Query oracle system
26. `oracle.search` - Search oracle knowledge
27. `oracle.simulate` - Simulate scenarios
28. `oracle.analyze` - Analyze data
29. `oracle.predict` - Predict outcomes

#### **🧠 MEMORY (Read & Write own data)** (7):
30. `memory.retrieve` - Retrieve memories
31. `memory.search` - Search memories
32. `memory.save` - Save new memory
33. `memory.search.semantic` - Semantic memory search
34. `memory.search.hybrid` - Hybrid memory search
35. `user.memory.retrieve` - Retrieve user memories
36. `user.memory.search` - Search user memories
37. `user.memory.save` - Save user memories

#### **🎭 IDENTITY & ONBOARDING** (2):
38. `identity.resolve` - Resolve user identity
39. `onboarding.start` - Start onboarding process

#### **🏢 BUSINESS OPERATIONS** (3):
40. `kbli.lookup` - Lookup KBLI codes
41. `kbli.requirements` - KBLI requirements
42. `kbli.search` - Search KBLI database

#### **📊 ANALYTICS (Read-only)** (3):
43. `analytics.overview` - Analytics overview
44. `analytics.weekly` - Weekly analytics
45. `activity.track` - Track activity

#### **📧 COMMUNICATION (Send messages)** (2):
46. `whatsapp.send.text` - Send WhatsApp text
47. `email.send` - Send email

#### **📰 INTEL & NEWS** (2):
48. `intel.news.search` - Search news
49. `intel.news.latest` - Latest news

#### **📍 LOCATION & MAPS** (5):
50. `location.geocode` - Geocode address
51. `location.reverse` - Reverse geocode
52. `maps.search` - Search maps
53. `maps.directions` - Get directions
54. `maps.distance` - Calculate distance

### **TOTALE TEAM MEMBERS**: **~53 handlers espliciti** + altri handler generici = **~80 handlers**

---

## 🌐 **DEMO USERS ACCESS** - 13 Handlers

### **Ruolo**: `demo`

### **Handlers Disponibili** (13):

#### **Sistema** (3):
1. `system.handlers.list`
2. `system.handlers.category`
3. `system.handlers.get`

#### **AI & Chat** (2):
4. `ai.chat`
5. `bali.zero.chat`

#### **RAG & Search** (2):
6. `rag.query`
7. `rag.search`

#### **Pricing** (2):
8. `bali.zero.pricing`
9. `pricing.official`

#### **Team** (2):
10. `team.login`
11. `team.logout`

#### **Memory** (1):
12. `memory.retrieve`

#### **Analytics** (1):
13. `activity.track` (tracking limitato)

---

## ❌ **HANDLERS FORBIDDEN** (Per Team Members & Demo):

### **Admin Operations**:
- `team.create` - ❌ Solo admin
- `team.delete` - ❌ Solo admin
- `team.update` - ❌ Solo admin
- `admin.*` - ❌ Solo admin

### **Data Modification (Sensitive)**:
- `gmail.send` - ❌ Solo admin (team members hanno email.send)
- `gmail.delete` - ❌ Solo admin
- `drive.delete` - ❌ Solo admin
- `sheets.update` - ❌ Solo admin
- `calendar.create` - ❌ Solo admin
- `calendar.delete` - ❌ Solo admin

### **Memory Delete**:
- `memory.delete` - ❌ Solo admin

### **CRM Operations**:
- `crm.*` - ❌ Solo admin

### **Work Sessions**:
- `session.end` - ❌ Solo admin
- `end_user_session` - ❌ Solo admin

### **Sensitive Data**:
- `client.*` - ❌ Solo admin
- `practice.*` - ❌ Solo admin
- `interaction.*` - ❌ Solo admin

---

## 🎯 **RIEPILOGO**:

### **👑 ADMIN (Zero)**:
- **164/164 handlers** (100%)
- Accesso completo illimitato
- Tutte le operazioni (read/write/delete)
- Dati sensibili inclusi

### **👥 TEAM MEMBERS** (Collaboratori, Developers):
- **~80/164 handlers** (49%)
- Operazioni complete su propri dati
- Read-only su dati sensibili
- No delete operations su dati critici
- No admin operations

### **🌐 DEMO USERS** (Pubblico):
- **13/164 handlers** (8%)
- Solo lettura
- Operazioni base
- No write operations
- No dati sensibili

---

**La configurazione RBAC è ora ottimizzata per il team Bali Zero!** 🚀

