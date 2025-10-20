# 🎯 ZERO Dashboard - Guida Completa

## 📊 Accesso Dashboard

**URL**: https://scintillating-kindness-production-47e3.up.railway.app/admin/zero/dashboard

**Accesso**: Aperto (nessuna autenticazione richiesta per ora)

---

## 🎨 Panoramica Dashboard

### Sezione 1: Statistiche in Tempo Reale

**4 Card statistiche principali:**

1. **Attivi Ora** 🟢
   - Numero di team members con sessione attiva
   - Aggiornamento: ogni 30 secondi

2. **Ore Oggi** ⏱️
   - Totale ore lavorate oggi da tutto il team
   - Somma di tutte le sessioni completate

3. **Conversazioni** 💬
   - Totale conversazioni gestite oggi
   - Contatore cumulativo di tutte le sessioni

4. **Team Members** 👥
   - Numero totale di membri del team attivi oggi
   - Include sessioni attive e completate

---

### Sezione 2: Sessioni Attive 🟢

**Mostra chi sta lavorando ORA:**

Colonne:
- Team Member (nome)
- Email
- Inizio (orario HH:MM)
- Fine (mostra "In corso")
- Durata (aggiornata in real-time)
- Conversazioni (contatore live)

**Cosa significa "Attiva":**
- Sessione iniziata ma non ancora chiusa
- Team member ha fatto almeno una chat oggi
- Non ha ancora detto "logout today"

---

### Sezione 3: Completate Oggi ✅

**Sessioni già chiuse oggi:**

Colonne:
- Team Member
- Email
- Inizio
- Fine (orario effettivo)
- Durata totale
- Conversazioni totali

**Come si chiude una sessione:**
- Team member scrive "logout today" in chat
- Sistema calcola automaticamente durata e statistiche
- Invio notifica a ZERO (attualmente in logs)

---

### Sezione 4: Riepilogo Settimanale 📈

**Ultimi 7 giorni di lavoro:**

Colonne:
- Team Member
- Email
- Ore Totali (somma di 7 giorni)
- Giorni Lavorati (quanti giorni distinti)
- Media Ore/Giorno
- Conversazioni totali

**Utilità:**
- Vedere chi lavora di più
- Identificare pattern di lavoro
- Calcolare produttività settimanale

---

## ⚡ Funzionalità Auto-Refresh

**Auto-aggiornamento ogni 30 secondi:**
- Dashboard si aggiorna automaticamente
- Nessun bisogno di ricaricare la pagina
- Ultimo aggiornamento mostrato in basso

**Quando aggiornare manualmente:**
- Se vuoi dati più freschi subito
- Premi F5 o ricarica pagina

---

## 🔍 Interpretare i Dati

### Durata = 0h 0m?

**Possibili cause:**
1. Team member ha appena iniziato (meno di 1 minuto)
2. Test rapidi
3. Sessione chiusa immediatamente

### Sessioni multiple stesso utente?

**Normale se:**
- Ha fatto logout e poi rientrato
- Test di funzionalità
- Sessioni su giorni diversi

### Conversazioni = 0?

**Significa:**
- Ha aperto sessione ma non ha chattato
- Solo attività senza conversazioni complete

---

## 📱 Utilizzo Consigliato

### Mattina (9:00-10:00)
- Controlla chi ha iniziato a lavorare
- Verifica sessioni attive
- Nota orari di inizio

### Durante il Giorno
- Monitora attività in real-time
- Controlla conversazioni accumulate
- Verifica durate sessioni

### Fine Giornata (18:00-19:00)
- Controlla sessioni completate
- Verifica ore totali giornata
- Controlla chi ha dimenticato logout

### Fine Settimana
- Analizza riepilogo settimanale
- Calcola produttività team
- Identifica pattern di lavoro

---

## 🔧 Problemi Comuni

### Dashboard non si carica?

**Soluzioni:**
1. Verifica URL corretto
2. Controlla connessione internet
3. Prova in incognito (cache)
4. Contatta support se persiste

### Dati non aggiornati?

**Soluzioni:**
1. Attendi prossimo auto-refresh (max 30s)
2. Ricarica pagina manualmente (F5)
3. Verifica ultimo aggiornamento in basso

### Manca un team member?

**Possibili cause:**
1. Non ha ancora chattato oggi
2. Email non in database collaborators
3. Usa email diversa da quella registrata

---

## 📊 Backup Dati

**Dove sono salvati i dati:**

1. **PostgreSQL (Primario)**
   - Tabella: `team_work_sessions`
   - Tabella: `team_daily_reports`
   - Cloud persistente su Railway

2. **JSONL (Backup locale)**
   - File: `apps/backend-rag/backend/data/work_sessions_log.jsonl`
   - Formato: JSON Lines (1 evento = 1 riga)
   - Script analisi: `python3 scripts/read_work_sessions_log.py`

**Come leggere backup JSONL:**
```bash
# Vedere tutte le sessioni chiuse
grep 'session_end' data/work_sessions_log.jsonl

# Sessioni di ZERO
grep 'zero@balizero.com' data/work_sessions_log.jsonl

# Analisi completa
python3 scripts/read_work_sessions_log.py
```

---

## 🎯 Prossimi Sviluppi

**Opzionali (se necessario):**

1. **Autenticazione**
   - Login richiesto per dashboard
   - Solo ZERO può accedere

2. **Email Notifiche**
   - Email automatiche a zero@balizero.com
   - Quando sessione inizia/finisce

3. **Grafici Visuali**
   - Chart.js per grafici
   - Trend settimanali/mensili

4. **Export Dati**
   - Download CSV/Excel
   - Report PDF automatici

5. **Filtri Avanzati**
   - Filtra per data
   - Filtra per team member
   - Cerca per email

---

## 📞 Support

**Per problemi tecnici:**
- Controlla logs Railway
- Verifica health endpoint: `/health`
- Testa API endpoints singolarmente

**API Endpoints disponibili:**
- `GET /team/sessions/today` - Sessioni oggi
- `GET /team/report/daily` - Report giornaliero
- `GET /team/report/weekly` - Report settimanale
- `POST /team/session/start` - Avvia sessione (auto)
- `POST /team/session/end` - Chiudi sessione (logout)

---

## ✅ Checklist Verifica Funzionamento

- [ ] Dashboard si apre correttamente
- [ ] Vedo 4 statistiche in alto
- [ ] Tabella sessioni attive visibile
- [ ] Tabella completate oggi visibile
- [ ] Riepilogo settimanale caricato
- [ ] Auto-refresh funziona (attendi 30s)
- [ ] Dati cambiano dopo team member fa chat
- [ ] "logout today" chiude sessione correttamente

---

**Dashboard creato**: 21 Ottobre 2025
**Versione**: 1.0
**Status**: ✅ Operativo su Railway
