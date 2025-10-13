# 🚀 Zantara Google Workspace Add-on Deployment Guide

## Overview
Questo add-on integra Zantara Bridge direttamente nel tuo Google Workspace, apparendo come un'app nel launcher insieme a Gmail, Drive, Calendar, etc.

## 📋 Prerequisites

1. **Google Workspace Admin Access** (per deployment organization-wide)
2. **Google Cloud Project** con APIs abilitate:
   - Google Workspace Add-ons API
   - Apps Script API
   - Gmail API, Drive API, Calendar API, Sheets API
3. **Service Account** configurato

## 🛠️ Step 1: Setup Apps Script Project

1. Vai su [script.google.com](https://script.google.com)
2. Crea un nuovo progetto: **"Zantara Workspace Add-on"**
3. Copia il contenuto di `Code.js` nel file principale
4. Vai su **Project Settings** > **Show "appsscript.json"** 
5. Sostituisci con il contenuto di `appsscript.json`

## 🔐 Step 2: Configure OAuth & Permissions

1. Nel progetto Apps Script:
   - Click **Deploy** > **Test deployments**
   - Select **Install add-on** 
   - Autorizza tutti i permessi richiesti

2. In Google Cloud Console:
   ```
   Project: involuted-box-469105-r0
   ```
   - Vai su **APIs & Services** > **OAuth consent screen**
   - Configura come **Internal** (per la tua org)
   - Aggiungi scopes necessari

## 📦 Step 3: Deploy as Workspace Add-on

### A. Test Deployment (Solo per te)

1. In Apps Script Editor:
   ```
   Deploy > Test deployments > Install
   ```

2. L'add-on apparirà in:
   - Gmail (sidebar)
   - Drive (sidebar)
   - Calendar (sidebar)
   - Docs/Sheets (Add-ons menu)

### B. Organization Deployment

1. **Create Deployment**:
   ```
   Deploy > New deployment
   Type: Add-on
   Description: Zantara Bridge v1.0
   ```

2. **Get Deployment ID**:
   - Copia il Deployment ID generato

3. **Install via Admin Console**:
   - Vai su [admin.google.com](https://admin.google.com)
   - Apps > Google Workspace Marketplace apps
   - Click **+** > **Add custom app**
   - Incolla Deployment ID
   - Scegli OU per deployment

## 🎨 Step 4: Customize Branding

1. **Logo e Icone**:
   Carica in una cartella pubblica:
   - `zantara-icon.png` (128x128px) - Per launcher
   - `zantara-logo.png` (400x120px) - Per header
   - Service icons (32x32px) - Per status indicators

2. **Update URLs** in `Code.js`:
   ```javascript
   const LOGO_URL = 'your-cdn-url/zantara-icon.png';
   ```

## 🌐 Step 5: Publish to Marketplace (Optional)

Per renderlo disponibile pubblicamente:

1. **Google Workspace Marketplace SDK**:
   - Enable in Cloud Console
   - Configure OAuth scopes
   - Add screenshots e descriptions

2. **Submit for Review**:
   - Compila form di submission
   - Fornisci video demo
   - Attendi approvazione (5-10 giorni)

## 🔧 Configuration Variables

Aggiorna questi valori in `Code.js`:

```javascript
const ZANTARA_API = 'https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app';
const BRAND_COLOR = '#667eea';
const ADMIN_EMAIL = 'admin@yourdomain.com';
```

## 📱 User Experience

Una volta installato, gli utenti vedranno:

1. **Nel Google Workspace Launcher**:
   - Icona Zantara tra le app
   - Click apre homepage dell'add-on

2. **In Gmail**:
   - Sidebar con analisi email
   - Compose helper
   - Quick actions

3. **In Drive**:
   - File organizer
   - Smart search
   - Duplicate finder

4. **In Calendar**:
   - Meeting scheduler
   - Daily summaries
   - Schedule optimizer

5. **In Sheets/Docs**:
   - Data analysis
   - Content generation
   - Export tools

## 🐛 Troubleshooting

### Add-on non appare
- Verifica deployment status
- Check OAuth consent screen
- Ricarica browser (Ctrl+F5)

### Errori di permessi
- Riautorizza add-on
- Check service account permissions
- Verifica API quotas

### API calls falliscono
- Controlla URL whitelist in `appsscript.json`
- Verifica CORS su backend
- Check network logs

## 📊 Monitoring

Monitor usage in:
- **Apps Script Dashboard**: Executions, errors
- **Cloud Console**: API usage, quotas
- **Admin Console**: User adoption, issues

## 🔄 Updates

Per aggiornare l'add-on:

1. Modifica codice in Apps Script
2. Create new deployment version
3. Users automatically get updates (entro 24h)

## 🎯 Next Steps

1. **Test** con un piccolo gruppo
2. **Collect feedback** via form
3. **Iterate** su features
4. **Roll out** all'intera organizzazione
5. **Monitor** adoption metrics

## 📞 Support

- **Documentation**: `/workspace-addon/docs`
- **Issues**: GitHub Issues
- **Email**: support@zantara.bridge

---

## Quick Deploy Script

```bash
#!/bin/bash
# Deploy Zantara Add-on

echo "📦 Deploying Zantara Workspace Add-on..."

# 1. Create Apps Script project
clasp create --title "Zantara Workspace Add-on" --type standalone

# 2. Push code
clasp push

# 3. Deploy
clasp deploy --description "Production v1.0"

# 4. Get deployment ID
clasp deployments

echo "✅ Deployment complete! Check Admin Console to install."
```

**Ready to transform your Google Workspace with Zantara! 🚀**