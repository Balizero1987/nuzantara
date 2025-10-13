# 🔧 GOOGLE WORKSPACE ADMIN - CONFIGURAZIONE DOMAIN-WIDE DELEGATION

## 📊 STATO ATTUALE
- ✅ **Funzionante**: Drive, Sheets, Docs, Slides, Calendar (5/6 servizi)
- ❌ **Non funzionante**: Gmail (1/6 servizi)
- **Service Account**: `zantara-bridge-v2@involuted-box-469105-r0.iam.gserviceaccount.com`
- **Client ID**: `113210531554033168032`

## 🚀 ISTRUZIONI PER L'AMMINISTRATORE

### STEP 1: Accedi a Google Admin Console
1. Vai su https://admin.google.com
2. Login con account amministratore del dominio `balizero.com`

### STEP 2: Naviga alle impostazioni API
```
Security → Access and data control → API Controls → Domain-wide Delegation
```
O direttamente: https://admin.google.com/u/2/ac/owl/domainwidedelegation

### STEP 3: Aggiungi nuovo Client ID
1. Clicca su **"Add new"**
2. Inserisci questi dati:
   - **Client ID**: `113210531554033168032`
   - **OAuth Scopes**: (copia TUTTA la riga sotto)

## 📋 SCOPE DA COPIARE (VERSIONE MINIMA - SOLO NECESSARI)
```
https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/contacts.readonly
```

## 📋 SCOPE COMPLETI (SE VUOI DARE ACCESSO TOTALE)
```
https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/gmail.compose,https://www.googleapis.com/auth/gmail.insert,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive.readonly,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/spreadsheets.readonly,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/documents.readonly,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/presentations.readonly,https://www.googleapis.com/auth/contacts,https://www.googleapis.com/auth/contacts.readonly,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/userinfo.profile
```

### STEP 4: Salva e Attendi
1. Clicca **"Authorize"**
2. Attendi 5-10 minuti per la propagazione
3. In alcuni casi può richiedere fino a 24 ore

## 🔒 CONSIDERAZIONI DI SICUREZZA

### Cosa può fare il Service Account:
- ✅ Impersonare SOLO `zero@balizero.com` (configurato nel codice)
- ✅ NON può accedere ad altri utenti del dominio
- ✅ Può essere revocato in qualsiasi momento

### Rischi:
- ⚠️ Se la chiave del Service Account viene compromessa, può:
  - Inviare email come zero@balizero.com
  - Accedere ai file Drive di zero@balizero.com
  - Modificare calendari di zero@balizero.com

### Raccomandazioni:
1. **Monitora**: Attiva audit log per il Service Account
2. **Ruota**: Cambia la chiave ogni 90 giorni
3. **Limita**: Usa solo gli scope minimi necessari (prima lista)

## ✅ VERIFICA CONFIGURAZIONE

Dopo aver configurato, esegui questo test:

```bash
# Dal server ZANTARA
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch"
node check-sa-scopes.mjs
```

Dovresti vedere:
```
Gmail   | ✅     | Working with current configuration
```

## 📞 SUPPORTO

Se hai problemi:
1. Verifica che il Client ID sia corretto: `113210531554033168032`
2. Controlla che gli scope siano stati copiati correttamente (senza spazi extra)
3. Attendi almeno 10 minuti per la propagazione

## 🎯 RISULTATO ATTESO

Dopo la configurazione:
- ✅ Gmail potrà inviare email
- ✅ Tutti i 6 servizi Google Workspace saranno operativi
- ✅ ZANTARA avrà accesso completo a Google Workspace per `zero@balizero.com`

---

**Nota**: Questa configurazione è SICURA perché il Service Account può impersonare SOLO l'utente specificato nel codice (`zero@balizero.com`) e non può accedere ad altri account del dominio.