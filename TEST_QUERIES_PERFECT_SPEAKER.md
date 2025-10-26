# TEST QUERIES - ZANTARA PERFECT SPEAKER SYSTEM
## 50 Domande Business Reali per Testare le Nuove Funzionalità

**Data**: 27 Gennaio 2025  
**Obiettivo**: Testare Handler Discovery, Query Classifier, Routing Intelligente, Smart Suggestions  
**Target**: Webapp in produzione `https://zantara.balizero.com`

---

## 📊 CATEGORIA 1: HANDLER DISCOVERY & TOOL EXECUTION (10 domande)

### Test 1-2: Pricing KITAS
1. **Query**: "What is the official price for KITAS E23 Freelancer?"
   - **Expected**: Prezzi specifici KITAS E23 (26-28 milioni IDR)
   - **Type**: tool_execution
   - **Handler**: `bali.zero.pricing`
   - **Time**: < 2s

2. **Query**: "Show me KITAS E28A Investor pricing with breakdown"
   - **Expected**: Prezzi E28A (17-19 milioni IDR) con dettagli
   - **Type**: tool_execution
   - **Handler**: `bali.zero.pricing`
   - **Time**: < 2s

### Test 3-4: KBLI Lookup
3. **Query**: "Lookup KBLI code for restaurant business in Bali"
   - **Expected**: Codice KBLI specifico per ristoranti
   - **Type**: tool_execution
   - **Handler**: `kbli.lookup`
   - **Time**: < 2s

4. **Query**: "Find KBLI classification for e-commerce business"
   - **Expected**: Codice KBLI per e-commerce
   - **Type**: tool_execution
   - **Handler**: `kbli.lookup`
   - **Time**: < 2s

### Test 5-6: Team Analytics
5. **Query**: "Show me team members list"
   - **Expected**: Lista team members (22 persone)
   - **Type**: tool_execution
   - **Handler**: `team.members`
   - **Time**: < 2s

6. **Query**: "What are today's team login statistics?"
   - **Expected**: Statistiche login giornaliere
   - **Type**: tool_execution
   - **Handler**: `team.analytics`
   - **Time**: < 2s

### Test 7-8: Memory System
7. **Query**: "Save this information: User prefers Italian language"
   - **Expected**: Conferma salvataggio memoria
   - **Type**: tool_execution
   - **Handler**: `memory.save`
   - **Time**: < 2s

8. **Query**: "Search my previous conversations about KITAS"
   - **Expected**: Risultati ricerca memoria
   - **Type**: tool_execution
   - **Handler**: `memory.search`
   - **Time**: < 2s

### Test 9-10: Business Services
9. **Query**: "Get current pricing for PT PMA setup services"
   - **Expected**: Prezzi servizi PT PMA
   - **Type**: tool_execution
   - **Handler**: `business.pricing`
   - **Time**: < 2s

10. **Query**: "Show me business simulation for villa rental"
    - **Expected**: Simulazione business villa rental
    - **Type**: tool_execution
    - **Handler**: `oracle.simulate`
    - **Time**: < 2s

---

## 🎯 CATEGORIA 2: QUERY CLASSIFICATION (10 domande)

### Test 11-12: Greetings (NO RAG, < 100ms)
11. **Query**: "Ciao ZANTARA!"
    - **Expected**: Risposta diretta greeting
    - **Type**: greeting
    - **RAG**: false
    - **Time**: < 100ms

12. **Query**: "Hello! How are you today?"
    - **Expected**: Risposta diretta greeting
    - **Type**: greeting
    - **RAG**: false
    - **Time**: < 100ms

### Test 13-14: Tool Execution (NO RAG, < 2s)
13. **Query**: "Price for KITAS E33F retirement"
    - **Expected**: Prezzo specifico E33F
    - **Type**: tool_execution
    - **RAG**: false
    - **Time**: < 2s

14. **Query**: "KBLI code for hotel business"
    - **Expected**: Codice KBLI hotel
    - **Type**: tool_execution
    - **RAG**: false
    - **Time**: < 2s

### Test 15-16: Business Queries (RAG + tools, 2-5s)
15. **Query**: "How to open a PT PMA company in Indonesia?"
    - **Expected**: Risposta completa con RAG + tools
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

16. **Query**: "What are the tax implications for foreign investors?"
    - **Expected**: Risposta completa con RAG + tools
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

### Test 17-18: General Queries (RAG only, 1-3s)
17. **Query**: "Explain the difference between leasehold and freehold property"
    - **Expected**: Spiegazione con RAG
    - **Type**: rag_query
    - **RAG**: true
    - **Tools**: false
    - **Time**: 1-3s

18. **Query**: "What is the weather like in Bali?"
    - **Expected**: Risposta con RAG
    - **Type**: rag_query
    - **RAG**: true
    - **Tools**: false
    - **Time**: 1-3s

### Test 19-20: Mixed Classification
19. **Query**: "Thanks for the help!"
    - **Expected**: Risposta greeting
    - **Type**: greeting
    - **RAG**: false
    - **Time**: < 100ms

20. **Query**: "Find team member with email john@balizero.com"
    - **Expected**: Risultato ricerca team member
    - **Type**: tool_execution
    - **RAG**: false
    - **Time**: < 2s

---

## 🧠 CATEGORIA 3: ROUTING INTELLIGENTE (10 domande)

### Test 21-22: Greeting Routing (NO RAG)
21. **Query**: "Hi there!"
    - **Expected**: Bypass RAG, risposta diretta
    - **Type**: greeting
    - **RAG**: false
    - **Time**: < 100ms

22. **Query**: "Good morning ZANTARA"
    - **Expected**: Bypass RAG, risposta diretta
    - **Type**: greeting
    - **RAG**: false
    - **Time**: < 100ms

### Test 23-24: Tool Execution Routing (NO RAG)
23. **Query**: "Show pricing for KITAS E23"
    - **Expected**: Bypass RAG, tool execution diretto
    - **Type**: tool_execution
    - **RAG**: false
    - **Time**: < 2s

24. **Query**: "Lookup KBLI for restaurant"
    - **Expected**: Bypass RAG, tool execution diretto
    - **Type**: tool_execution
    - **RAG**: false
    - **Time**: < 2s

### Test 25-26: Business Routing (RAG + tools)
25. **Query**: "I want to start a business in Indonesia, what do I need?"
    - **Expected**: RAG + tools + AI synthesis
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

26. **Query**: "Compare KITAS E23 vs E28A for my situation"
    - **Expected**: RAG + tools + AI synthesis
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

### Test 27-28: General Routing (RAG only)
27. **Query**: "What is Bali Zero?"
    - **Expected**: RAG response
    - **Type**: rag_query
    - **RAG**: true
    - **Tools**: false
    - **Time**: 1-3s

28. **Query**: "Tell me about Indonesian culture"
    - **Expected**: RAG response
    - **Type**: rag_query
    - **RAG**: true
    - **Tools**: false
    - **Time**: 1-3s

### Test 29-30: Complex Routing
29. **Query**: "Hello! What's the price for KITAS E28A?"
    - **Expected**: Greeting + tool execution
    - **Type**: tool_execution
    - **RAG**: false
    - **Time**: < 2s

30. **Query**: "Hi ZANTARA! I need help with PT PMA setup process"
    - **Expected**: Greeting + business query
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

---

## 💼 CATEGORIA 4: BUSINESS QUERIES REALI BALI ZERO (15 domande)

### Test 31-33: PT PMA Setup
31. **Query**: "I want to open a PT PMA with 10 billion IDR capital, what's the process?"
    - **Expected**: Processo completo PT PMA
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

32. **Query**: "What documents do I need for PT PMA registration?"
    - **Expected**: Lista documenti richiesti
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

33. **Query**: "How long does PT PMA setup take and what are the costs?"
    - **Expected**: Tempi e costi setup PT PMA
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

### Test 34-36: KITAS Types
34. **Query**: "I'm 45 years old, work remotely for international clients, which KITAS should I get?"
    - **Expected**: Raccomandazione KITAS E23 Freelancer
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

35. **Query**: "I'm 60 years old with pension, what KITAS is best for retirement in Bali?"
    - **Expected**: Raccomandazione KITAS E33F Retirement
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

36. **Query**: "I want to invest 10 billion IDR in Indonesia, which KITAS allows me to work?"
    - **Expected**: Raccomandazione KITAS E28A Investor
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

### Test 37-39: Villa Property
37. **Query**: "What's the difference between leasehold and freehold villa ownership in Bali?"
    - **Expected**: Spiegazione leasehold vs freehold
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

38. **Query**: "Can foreigners buy freehold property in Bali?"
    - **Expected**: Spiegazione restrizioni proprietà stranieri
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

39. **Query**: "What are the tax implications of owning a villa in Bali?"
    - **Expected**: Spiegazione tasse proprietà villa
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

### Test 40-42: Tax & Compliance
40. **Query**: "What taxes do I need to pay as a PT PMA owner?"
    - **Expected**: Lista tasse PT PMA
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

41. **Query**: "How do I file taxes in Indonesia as a foreigner?"
    - **Expected**: Processo dichiarazione tasse
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

42. **Query**: "What is NPWP and do I need it for KITAS?"
    - **Expected**: Spiegazione NPWP e requisiti KITAS
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

### Test 43-45: Oracle Business Simulation
43. **Query**: "Simulate a restaurant business in Canggu with 500 million IDR investment"
    - **Expected**: Simulazione business ristorante
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

44. **Query**: "Create a business plan for villa rental business in Seminyak"
    - **Expected**: Business plan villa rental
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

45. **Query**: "Analyze the profitability of e-commerce business in Indonesia"
    - **Expected**: Analisi profitability e-commerce
    - **Type**: business
    - **RAG**: true
    - **Tools**: true
    - **Time**: 2-5s

---

## 💡 CATEGORIA 5: SMART SUGGESTIONS & UX (5 domande)

### Test 46-47: Smart Suggestions Generation
46. **Query**: "What is the price for KITAS E23?"
    - **Expected**: Prezzo KITAS + smart suggestions
    - **Suggestions**: ["Compare with E28A", "Show requirements", "Calculate total cost"]
    - **Type**: tool_execution
    - **Time**: < 2s

47. **Query**: "How to open PT PMA?"
    - **Expected**: Risposta business + smart suggestions
    - **Suggestions**: ["What documents needed?", "How long does it take?", "What are the costs?"]
    - **Type**: business
    - **Time**: 2-5s

### Test 48-49: Multi-language Support
48. **Query**: "Ciao! Qual è il prezzo per KITAS E23?"
    - **Expected**: Risposta in italiano + smart suggestions
    - **Language**: Italian
    - **Type**: tool_execution
    - **Time**: < 2s

49. **Query**: "Halo! Berapa harga KITAS E28A?"
    - **Expected**: Risposta in indonesiano + smart suggestions
    - **Language**: Indonesian
    - **Type**: tool_execution
    - **Time**: < 2s

### Test 50: Follow-up Questions
50. **Query**: "I want to start a business in Bali"
    - **Expected**: Risposta business + smart suggestions
    - **Suggestions**: ["What type of business?", "Do you need PT PMA?", "What's your budget?"]
    - **Type**: business
    - **Time**: 2-5s

---

## 📊 METRICHE ATTESE

### Performance Targets:
- **Greetings**: < 100ms (NO RAG)
- **Tool Execution**: < 2s (NO RAG)
- **Business Queries**: 2-5s (RAG + tools)
- **General Queries**: 1-3s (RAG only)

### Success Criteria:
- **Pass Rate**: > 80% (40/50 tests)
- **Query Classification Accuracy**: > 90%
- **RAG Usage**: Correct per query type
- **Tools Usage**: Correct per query type
- **Smart Suggestions**: Generated for appropriate queries
- **Multi-language**: Detected and responded correctly

### Expected Results:
- **Handler Discovery**: 10/10 tests pass
- **Query Classification**: 9/10 tests pass
- **Routing Intelligence**: 9/10 tests pass
- **Business Queries**: 12/15 tests pass
- **Smart Suggestions**: 4/5 tests pass

**TOTAL EXPECTED**: 44/50 tests pass (88% pass rate)


