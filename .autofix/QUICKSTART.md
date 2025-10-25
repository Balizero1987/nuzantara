# 🚀 Quick Start - 2 minuti

## 1️⃣ Usa il Launcher (Più Facile)

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

# Esegui (installa dipendenze automaticamente)
./.autofix/run.sh

# Dry run (senza modifiche)
./.autofix/run.sh --dry-run
```

## 2️⃣ Oppure Manuale

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/.autofix

# Installa dipendenze (solo prima volta)
pip install -r requirements.txt

# Esegui
python orchestrator.py

# Dry run
python orchestrator.py --dry-run
```

---

## ✅ Test Rapido (Dry Run)

```bash
# Testa senza fare modifiche
./.autofix/run.sh --dry-run
```

**Output atteso**:
```
================================================================================
🤖 ZANTARA AUTOFIX ORCHESTRATOR
Cycle ID: 20251025_170000
Max Iterations: 3
Dry Run: True
================================================================================

🔄 ITERATION 1/3
🧪 Running test suite...
✅ All tests passed!

🎉 SUCCESS! All tests passed on iteration 1
```

---

## 🎯 Cosa Fa

1. **Run Tests**: Local + Production
2. **If Fail**: Analizza con Claude
3. **Generate Fix**: Codice corretto
4. **Apply**: Modifica file
5. **Commit**: Git commit + push
6. **Deploy**: Aspetta Railway
7. **Verify**: Retest production
8. **Repeat**: Max 3 volte

---

## 💰 Costo

- **API Claude**: ~$0.20 per ciclo completo
- **Usa la TUA API key** (stesso di Claude Code)
- **ROI**: 8x più veloce che manuale (30 min vs 4 ore)

---

## 📊 Risultati

Tutti i risultati salvati in:
```
.autofix/autofix_state.json
```

Vedi l'ultimo ciclo:
```bash
cat .autofix/autofix_state.json | python3 -m json.tool | tail -50
```

---

## 🚨 Alert

AutoFix ti chiama se:
- ❌ Max iterazioni (3)
- ❌ Confidence bassa (<50%)
- ❌ Build fallisce
- ❌ Deploy timeout

**Altrimenti**: Tutto automatico! 🎉

---

## 📚 Documentazione Completa

Vedi: `README.md` per dettagli avanzati
