# Fix AI Responses - Backend Modifications Needed

## Problemi Risolti nel Frontend ✅

1. **"Ciao Zero" ripetitivo** - Risolto nel frontend
   - Il filtro rimuove "Ciao Zero" se non è la prima volta nella giornata
   - Usa localStorage per tracciare il saluto giornaliero

2. **Numero WhatsApp nelle risposte** - Risolto nel frontend
   - Il filtro rimuove automaticamente:
     - "Need help with this? Reach out on WhatsApp..."
     - "+62 859 0436 9574" e varianti
     - Qualsiasi numero WhatsApp alla fine delle risposte

## Modifiche Necessarie nel Backend RAG

### 1. Aggiornare System Prompt per rimuovere WhatsApp

Nel backend RAG (probabilmente in `apps/backend-rag/backend/llm/zantara_ai_client.py` o simile), aggiornare il system prompt per:

```python
SYSTEM_PROMPT = """
You are ZANTARA, an expert legal and business assistant for Indonesia, specializing in:
- Immigration and visa matters (B211A, KITAS, KITAP, D12, etc.)
- Business registration (PT PMA, PT Lokal)
- Tax obligations for expats
- Property purchase regulations
- General legal and business advice for foreigners in Indonesia

CRITICAL RULES:
1. NEVER include WhatsApp numbers or contact information in your responses
2. NEVER include phrases like "Need help? Reach out on WhatsApp" or similar
3. Do NOT greet with "Ciao Zero" unless it's the first message of the conversation
4. Provide accurate, up-to-date information based on current Indonesian regulations
5. If you don't know specific prices or costs, say so clearly rather than guessing
6. Focus on providing actionable, verified information

When providing information:
- Be professional but conversational
- Use clear, concise language
- Include specific requirements, dates, and procedures when available
- If prices are mentioned, ensure they are current and accurate
- Always cite sources when possible
"""
```

### 2. Aggiornare informazioni sui prezzi

Il backend dovrebbe avere una knowledge base aggiornata con:
- Prezzi attuali dei visti (D12, B211A, KITAS, etc.)
- Costi di registrazione aziendale
- Tariffe aggiornate

**Esempio per D12 Visa:**
- Il prezzo del visto D12 può variare, ma dovrebbe essere verificato con fonti ufficiali
- Aggiornare la knowledge base con informazioni accurate e recenti

### 3. Gestione del saluto

Il backend dovrebbe:
- Controllare se è la prima interazione della giornata
- Includere il saluto solo se necessario
- Non ripetere "Ciao Zero" in ogni risposta

### 4. Rimozione WhatsApp nel backend

Aggiungere un post-processing step che rimuove:
- Numeri di telefono WhatsApp
- Frasi che invitano a contattare via WhatsApp
- Informazioni di contatto non necessarie

## File da Modificare nel Backend

1. **System Prompt**: `apps/backend-rag/backend/llm/zantara_ai_client.py` (o simile)
2. **Knowledge Base**: Aggiornare con prezzi e informazioni corrette
3. **Response Filter**: Aggiungere filtro post-processing per rimuovere WhatsApp

## Note

- Il filtro frontend funziona come fallback, ma è meglio risolvere il problema alla fonte (backend)
- I prezzi devono essere aggiornati nella knowledge base del backend RAG
- Il system prompt dovrebbe essere aggiornato per evitare questi problemi

