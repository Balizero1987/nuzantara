# 💻 Code Examples - NUZANTARA

**Quick reference for common development tasks**

---

## 📚 Available Examples

| Guide | Description | For Who |
|-------|-------------|---------|
| [Handler Integration](./HANDLER_INTEGRATION.md) | Create new TypeScript handlers | Backend Devs |
| [RAG Search Integration](./RAG_SEARCH_EXAMPLE.md) | Use RAG backend from TS | Full-stack Devs |
| [Tool Creation](./TOOL_CREATION.md) | Add new tools for ZANTARA | AI Engineers |
| [API Client Usage](./API_CLIENT_EXAMPLES.md) | Call NUZANTARA APIs | Frontend/External Devs |

---

## 🚀 Quick Start

### 1. Call RAG Backend from TypeScript

```typescript
import { RAGService } from '../services/ragService';

const ragService = new RAGService(process.env.RAG_BACKEND_URL);

const response = await ragService.query({
  query: "What documents needed for KITAS?",
  user_id: "user_123",
  user_email: "test@example.com"
});

console.log(response.answer); // RAG answer
console.log(response.sources); // Source documents
```

### 2. Use Golden Answers (Python)

```python
from services.golden_answer_service import GoldenAnswerService

service = GoldenAnswerService(database_url=os.getenv("DATABASE_URL"))
await service.connect()

# Fast lookup (10-20ms)
answer = await service.lookup_answer("What docs for KITAS?")

if answer:
    print(f"✅ Golden: {answer['answer']}")  # Instant response
else:
    print("❌ No match, use RAG")  # Fallback to RAG
```

### 3. Create Simple Handler

```javascript
// apps/backend-ts/src/handlers/my-category/my-handler.js

export default {
  key: 'my-category.my-action',
  description: 'Does something useful',
  params: {
    input: { type: 'string', required: true }
  },

  async handler({ input }) {
    // Your logic here
    return {
      ok: true,
      data: { result: `Processed: ${input}` }
    };
  }
};
```

---

## 🔗 Related Documentation

- **Architecture**: [Technical Architecture](../galaxy-map/02-technical-architecture.md)
- **API Reference**: [API Documentation](../api/API_DOCUMENTATION.md)
- **Deployment**: [Railway Deployment Guide](../guides/RAILWAY_DEPLOYMENT_GUIDE.md)

---

**Start coding with confidence!** 💪
