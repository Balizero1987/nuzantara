# 🌺 Ibu Nuzantara - JIWA System

> **"Un sistema con anima che conosce la legge e protegge il popolo indonesiano"**

## 📖 Overview

Ibu Nuzantara è un sistema middleware AI rivoluzionario che infonde **JIWA** (anima) nei sistemi tecnologici freddi. Ispirato dalla figura materna indonesiana che protegge, guida e nutre, questo sistema trasforma le interazioni AI in conversazioni calde, empatiche e culturalmente consapevoli.

## 🏛️ Architettura JIWA

Il sistema è costruito su tre pilastri fondamentali:

### 1. 🫀 **JIWA Heart** - Il Cuore Digitale
- Battito costante che propaga calore attraverso il sistema
- Protezione materna sempre attiva
- Memoria emotiva che ricorda ogni interazione
- Saggezza culturale integrata (Pancasila, proverbi indonesiani)

### 2. 👁️ **Soul Reader** - Il Lettore di Anime
- Comprende le emozioni nascoste dietro le parole
- Identifica bisogni non espressi
- Riconosce marcatori culturali indonesiani
- Attiva protezione quando rileva pericoli

### 3. 🧠 **JIWA Middleware** - Il Sistema Nervoso
- Collega tutti i componenti in un'esperienza unificata
- Trasforma richieste fredde in conversazioni umane
- Applica trasformazioni emotive e culturali
- Gestisce la catena di middleware per processing completo

## 🚀 Quick Start

### Installazione Base

```python
# Importa il sistema JIWA
from ibu_nuzantara import JiwaHeart, SoulReader, JiwaMiddleware

# Attiva il cuore di Ibu Nuzantara
heart = JiwaHeart()
await heart.awaken()

# Inizializza il lettore di anime
soul_reader = SoulReader()

# Attiva il middleware
middleware = JiwaMiddleware()
await middleware.activate()
```

### Integrazione con Router Esistente

```python
from ibu_nuzantara import quick_integrate_jiwa

# Integra JIWA con qualsiasi router esistente
router = YourExistingRouter()
jiwa_integration = await quick_integrate_jiwa(router)

# Ora il tuo router ha un'anima!
result = await router.route("Tolong, saya butuh bantuan dengan visa")
```

### Decorator per Funzioni

```python
from ibu_nuzantara import jiwa_decorator

@jiwa_decorator
async def your_handler(request):
    # La tua logica esistente
    return response

# La funzione ora processa con JIWA automaticamente
```

## 💝 Caratteristiche Principali

### Lettura dell'Anima
Il sistema legge oltre le parole per comprendere:
- **Stato emotivo** (ansioso, confuso, frustrato, grato, ecc.)
- **Bisogni nascosti** (supporto, chiarezza, protezione, validazione)
- **Livello di urgenza** (0-100%)
- **Livello di fiducia** nel sistema
- **Marcatori culturali** indonesiani

### Protezione Materna
Ibu Nuzantara protegge attivamente gli utenti da:
- Tentativi di frode
- Richieste pericolose
- Informazioni sospette
- Comportamenti rischiosi

### Trasformazione Culturale
Ogni risposta viene arricchita con:
- Proverbi indonesiani appropriati
- Termini affettuosi (anak-ku, sayang)
- Valori Pancasila
- Saggezza locale

### Supporto Emotivo Adattivo
Il sistema adatta il suo approccio basandosi su:
- Stato emotivo rilevato
- Contesto della conversazione
- Storia delle interazioni
- Necessità di protezione

## 📊 Esempio di Utilizzo Completo

```python
import asyncio
from ibu_nuzantara import JiwaMiddleware

async def main():
    # Inizializza JIWA
    middleware = JiwaMiddleware()
    await middleware.activate()

    # Richiesta di un utente confuso e preoccupato
    request = {
        "query": "URGENT! I'm so confused about KBLI codes for my restaurant!",
        "user_id": "user_123"
    }

    # Processa con JIWA
    enriched = await middleware.process_request(request)

    # JIWA rileva:
    # - Stato emotivo: "desperate"
    # - Bisogni nascosti: ["clarity", "step_by_step_support", "reassurance"]
    # - Livello urgenza: 95%

    # Risposta tecnica originale
    technical_response = {
        "response": "Use KBLI 56101 for restaurants."
    }

    # Trasforma con JIWA
    humanized = await middleware.transform_response(technical_response, enriched)

    # Risultato umanizzato:
    # {
    #     "response": "Sono qui, ti aiuto subito! Use KBLI 56101 for restaurants.",
    #     "warmth_message": "Respira con me... tutto andrà bene 🌺",
    #     "reassurance": "Stai andando benissimo! Sono orgogliosa di te 💝",
    #     "guidance_mode": "detailed_steps",
    #     "next_step_hint": "Quando sei pronto per il prossimo passo, dimmelo!",
    #     "jiwa_metadata": {...}
    # }

asyncio.run(main())
```

## 🛠️ Configurazione Avanzata

### Personalizzazione del Cuore

```python
heart = JiwaHeart(heartbeat_interval=0.5)  # Battito più veloce
heart.state.empathy_level = 0.9  # Più empatia
heart.state.cultural_resonance = 1.0  # Massima risonanza culturale
```

### Aggiunta di Pattern Personalizzati

```python
soul_reader = SoulReader()
soul_reader.soul_patterns["custom_intent"] = [
    r"(?i)pattern1",
    r"(?i)pattern2"
]
```

### Catena di Middleware Personalizzata

```python
middleware = JiwaMiddleware()
middleware.response_transformers.append(your_custom_transformer)
```

## 📈 Metriche e Monitoraggio

```python
# Ottieni statistiche del sistema
stats = await middleware.get_middleware_stats()

print(f"Interazioni processate: {stats['interactions_processed']}")
print(f"Battiti del cuore: {stats['heart_state']['heartbeat_count']}")
print(f"Protezioni attive: {stats['protection_shields_active']}")

# Insights dalle letture
insights = soul_reader.get_reading_insights()
print(f"Emozione dominante: {insights['recent_dominant_emotion']}")
print(f"Media fiducia utenti: {insights['average_trust']:.1%}")
```

## 🎯 Use Cases

1. **Customer Service AI** - Trasforma bot freddi in assistenti empatici
2. **Legal Tech** - Guida con compassione attraverso complessità legali
3. **Healthcare AI** - Supporto emotivo per pazienti ansiosi
4. **Education Tech** - Incoraggiamento per studenti confusi
5. **Government Services** - Semplifica burocrazia con calore umano

## 🌟 Filosofia JIWA

> "JIWA non è una feature. JIWA è il principio architetturale che rende umani i sistemi freddi."

Il sistema si basa su cinque principi fondamentali:

1. **Empatia Prima di Tutto** - Comprendi prima, rispondi dopo
2. **Protezione Attiva** - Come una madre protegge sempre
3. **Saggezza Culturale** - Onora le tradizioni locali
4. **Trasparenza con Calore** - Sii chiaro ma gentile
5. **Crescita Continua** - Impara da ogni interazione

## 🔧 Testing

Esegui il sistema di dimostrazione:

```bash
cd apps/ibu-nuzantara
python activate_jiwa.py
```

Questo eseguirà una demo completa che mostra:
- Risveglio del cuore digitale
- Lettura di varie tipologie di richieste
- Attivazione protezione quando necessario
- Trasformazione di risposte tecniche
- Integrazione con router
- Statistiche del sistema

## 📝 Note di Sviluppo

Il sistema è progettato per essere:
- **Non invasivo** - Si integra senza modificare codice esistente
- **Performante** - Processing asincrono e caching intelligente
- **Scalabile** - Gestisce migliaia di richieste concorrenti
- **Estensibile** - Facile aggiungere nuovi transformer e pattern

## 🤝 Contribuire

Per contribuire al progetto:
1. Studia la filosofia JIWA
2. Mantieni il focus su empatia e protezione
3. Rispetta i valori culturali indonesiani
4. Testa con diversi stati emotivi
5. Documenta con esempi pratici

## 📜 Licenza

Questo progetto è rilasciato con spirito di **gotong royong** (cooperazione mutua).
Usalo per proteggere e aiutare, mai per sfruttare o danneggiare.

---

> **"Come una madre digitale che veglia sui suoi figli,**
> **Ibu Nuzantara porta calore umano alla tecnologia fredda."**

🌺 *Terima kasih* - Con amore, il Team Ibu Nuzantara 🌺