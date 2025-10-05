# 📊 ZANTARA Training Data Status

## ✅ COMPLETATO (664 esempi estratti)

### **WhatsApp Conversations**: 506 esempi
- Visa inquiries: 62
- Company setup: 50
- Tax consultation: 44
- Emergency: 6
- Pricing: 25
- General support: 319

### **Q&A Patterns**: 158 esempi
- General: 123
- Tax: 11
- Legal: 10
- Property: 5
- Company: 4
- Visa: 3
- Banking: 2

---

## 🎯 TARGET: 6,000 esempi totali

### **Abbiamo**: 664 / 6,000 (11%)
### **Mancano**: 5,336 esempi

---

## 📝 PROSSIMI PASSI per raggiungere 6,000

### 1. **Espandi estrazione WhatsApp** (+2,000)
```python
# Includere più contatti:
- Bebe (1,667 messaggi)
- Gianluca Caldarelli (343)
- Altri clienti business

# Estrarre anche:
- Conversazioni più corte (min 2 messaggi invece di 3)
- Pattern di follow-up
- Gestione obiezioni
```

### 2. **Knowledge Base ChromaDB** (+2,000)
```python
# Trasformare docs in Q&A:
- KBLI codes → "What KBLI for restaurant?" → "KBLI 56101..."
- Visa types → "Difference B211A vs B211B?" → "B211A is for..."
- Tax rules → "VAT in Indonesia?" → "VAT is 11%..."
- Company reqs → "PT PMA requirements?" → "Need 10B IDR..."
```

### 3. **Synthetic Generation** (+1,336)
```python
# Generare variazioni da pattern esistenti:
- Parafrasare domande comuni
- Tradurre IT ↔ EN
- Aggiungere contesto culturale
- Variare urgency levels
```

---

## 💾 FILE GENERATI

1. `zantara_training_3000.jsonl` - 506 conversazioni
2. `zantara_qa_2000.jsonl` - 158 Q&A
3. `zantara_combined_training.jsonl` - 664 totali ✅

---

## 🔧 SCRIPT DISPONIBILI

- `scripts/extract_whatsapp_training.py` - Estrae conversazioni
- `scripts/extract_qa_patterns.py` - Estrae Q&A da gruppi

---

## 📈 QUALITÀ vs QUANTITÀ

**Attuale**: 664 esempi REALI di alta qualità
**Opzione A**: Fermarsi qui e fare fine-tuning leggero
**Opzione B**: Espandere a 2,000 con più WhatsApp
**Opzione C**: Target 6,000 con synthetic data

### 🎯 RACCOMANDAZIONE

```
Priorità 1: Estrarre altri 1,500 da WhatsApp (totale 2,200 reali)
Priorità 2: Aggiungere 1,000 da knowledge base
Priorità 3: Stop a 3,200 - qualità > quantità
```

**Meglio 3,000 esempi PERFETTI che 6,000 mediocri!**

---

## ⚡ QUICK ACTION

Per continuare subito:
```bash
# Estrai da più contatti
python3 scripts/extract_whatsapp_training.py --expand

# O inizia training con quello che hai
python3 train_llama4.py zantara_combined_training.jsonl
```