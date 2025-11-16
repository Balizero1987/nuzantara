# Bali Zero Journal - Dashboard

Next.js dashboard per il monitoring del sistema Bali Zero Journal.

## Setup

1. Installa le dipendenze:
```bash
npm install
```

2. Configura l'URL dell'API backend:
```bash
cp .env.local.example .env.local
# Modifica API_URL se necessario
```

3. Avvia il server di sviluppo:
```bash
npm run dev
```

La dashboard sarà disponibile su `http://localhost:3001`

## Build per produzione

```bash
npm run build
npm start
```

## Features

- ✅ Real-time metrics (auto-refresh ogni 30s)
- ✅ Grafici interattivi (Recharts)
- ✅ Source status monitoring
- ✅ Cost tracking e breakdown
- ✅ System health monitoring
- ✅ Alert system
- ✅ Category breakdown
- ✅ Processing timeline

## API Endpoints utilizzati

- `GET /api/dashboard/stats` - Statistiche complete
- `GET /api/sources/status` - Status delle sorgenti

## Tecnologie

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts (grafici)
- Lucide React (icone)

