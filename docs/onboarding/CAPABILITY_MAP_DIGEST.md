# Capability Map Digest (Top 25)
Last Updated: 2025-10-10

Purpose
- Quick reference of core handlers with real examples and typical errors.

## Top Handlers by Category (selection)

### AI Services (6)
1. ai.chat – generic AI chat
```json
{"key":"ai.chat","params":{"prompt":"Hello"}}
```
Rate: 30/min • Cost: ~$0.05/query

2. bali.zero.chat – Bali Zero assistant (RAG + Claude)
```json
{"key":"bali.zero.chat","params":{"query":"What is KBLI for IT?","user_role":"member"}}
```
Rate: 20/min • High cost • Streams in UI

### Google Workspace (top)
3. gmail.send
```json
{"key":"gmail.send","params":{"to":"user@example.com","subject":"Test","body":"Hello"}}
```
4. calendar.list
```json
{"key":"calendar.list","params":{"maxResults":10}}
```
5. drive.search
```json
{"key":"drive.search","params":{"query":"invoice","pageSize":10}}
```

### Bali Zero Business (top)
6. pricing.official
```json
{"key":"pricing.official","params":{"service_type":"visa","include_details":true}}
```
7. bali.zero.pricing
```json
{"key":"bali.zero.pricing","params":{"service":"pt_pma"}}
```
8. team.list
```json
{"key":"team.list"}
```
9. team.recent_activity
```json
{"key":"team.recent_activity","params":{"hours":24,"limit":5}}
```
10. kbli.lookup
```json
{"key":"kbli.lookup","params":{"code":"62010"}}
```

### Memory System (top)
11. memory.save
```json
{"key":"memory.save","params":{"userId":"user123","content":"Prefers morning meetings"}}
```
12. memory.retrieve
```json
{"key":"memory.retrieve","params":{"userId":"user123"}}
```
13. memory.search.hybrid
```json
{"key":"memory.search.hybrid","params":{"userId":"user123","query":"morning","limit":5}}
```
14. memory.search.semantic
```json
{"key":"memory.search.semantic","params":{"userId":"user123","query":"meeting preferences"}}
```
15. memory.cache.stats
```json
{"key":"memory.cache.stats"}
```

### RAG Backend (proxy)
16. rag.query
```json
{"key":"rag.query","params":{"query":"KITAS extension procedure?","k":5}}
```
17. rag.search
```json
{"key":"rag.search","params":{"query":"visa requirements","limit":10}}
```

### Communication (examples)
18. whatsapp.send
```json
{"key":"whatsapp.send","params":{"to":"6281234567890","message":"Hello"}}
```
19. instagram.send
```json
{"key":"instagram.send","params":{"recipient_id":"123","message":"Hi"}}
```

### Identity/Auth
20. identity.resolve
```json
{"key":"identity.resolve","params":{"email":"user@domain.com"}}
```

### Maps (examples)
21. maps.places
```json
{"key":"maps.places","params":{"query":"coworking","location":"-8.6705,115.2126"}}
```

### Admin/System
22. system.handlers.list
```json
{"key":"system.handlers.list"}
```
23. system.handlers.tools
```json
{"key":"system.handlers.tools"}
```

## Common Errors
| Error | Cause | Fix |
|---|---|---|
| handler_not_found | Wrong key name | Check spelling (team.list) |
| 401 Unauthorized | Missing API key/origin | Add x-api-key or use webapp origin |
| 429 Too Many Requests | Rate limit exceeded | Wait 60s or use internal key |
| param_missing | Required param missing | Check docs (userId, serviceType) |
| param_type_mismatch | Wrong type | Use camelCase and correct types |

## Automation
Generate full tool list:
```bash
curl -s -X POST \
  https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{"key":"system.handlers.tools"}' | jq
```
