# 🌐 BALI ZERO LANGUAGE SWITCHER - ENTERPRISE SOLUTION

> **Sistema di traduzione unificato per tutto l'ecosistema balizero.com**  
> Versione 2.0.0 - React/Next.js + Vanilla JS + Configurazione Condivisa

## 🎯 OVERVIEW

Sistema language switcher enterprise-grade che garantisce **continuità perfetta** tra:
- **🏠 Sito principale**: balizero.com (React/Next.js)
- **📄 Landing pages**: balizero.com/landing/* (HTML statico)
- **⚙️ Configurazione condivisa**: Comportamento identico ovunque

## ✨ CARATTERISTICHE PRINCIPALI

### **🎨 Design Unificato**
- ✅ **Posizione fissa**: Top-right (20px, 20px) su tutto il sito
- ✅ **Colori brand**: Gold accent (#D4AF37), navy background
- ✅ **Animazioni smooth**: Transizioni fluide con blur effects
- ✅ **Responsive**: Ottimizzato per mobile e desktop

### **🚀 UX/Performance** 
- ✅ **Auto-detect**: Rileva lingua browser al primo accesso
- ✅ **Persistence**: Ricorda preferenza utente con localStorage
- ✅ **Preloader**: Feedback visivo durante cambio lingua
- ✅ **Lazy loading**: Immagini caricate solo quando necessario

### **♿ Accessibility Enterprise**
- ✅ **Screen readers**: ARIA completo (labels, roles, states) 
- ✅ **Keyboard navigation**: Alt+L, frecce, ESC, Enter
- ✅ **High contrast**: Support automatico per utenti ipovedenti
- ✅ **Reduced motion**: Rispetta preferenze di accessibilità
- ✅ **Touch targets**: Minimum 44px per dispositivi touch

### **📱 Mobile First**
- ✅ **Gesture swipe**: Left/Right per cambio lingua
- ✅ **Touch feedback**: Scale animation su tap
- ✅ **Performance**: Eventi throttled + passive listeners
- ✅ **Adaptive positioning**: Si adatta alle dimensioni schermo

## 🏗️ ARCHITETTURA

```
balizero.com/
├── 🎯 Main Site (React/Next.js)
│   ├── components/language-switcher.tsx    # React component
│   ├── lib/i18n.ts                        # Next.js i18n system  
│   └── app/globals.css                     # Shared styles
│
├── 🎯 Landing Pages (Static HTML)
│   ├── public/js/landing-i18n.js          # Vanilla JS system
│   └── public/landing page/*.html          # 7 landing pages
│
├── 🔧 Shared Configuration
│   ├── shared/language-switcher-config.js  # Unified config
│   └── docs/LANGUAGE_SWITCHER_*.md         # Documentation
│
└── 🎨 Design System
    ├── Colors: vivid-black, gold, cream, navy
    ├── Typography: Playfair (serif) + Inter (sans)
    └── Animations: smooth transitions + accessibility
```

## 🚀 QUICK START

### **1. Sito Principale (React)**
```tsx
import { LanguageSwitcher } from '@/components/language-switcher'

export default function Header() {
  return (
    <header>
      <LanguageSwitcher className="ml-auto" />
    </header>
  )
}
```

### **2. Landing Pages (HTML)**
```html
<script src="/js/landing-i18n.js"></script>
```

### **3. Configurazione Condivisa**
```javascript
import { LANGUAGE_CONFIG, LanguageSwitcherUtils } from '@/shared/language-switcher-config'

// Auto-detect + save
const locale = LanguageSwitcherUtils.loadLocale()
LanguageSwitcherUtils.saveLocale('id', true)

// Gesture handling
LanguageSwitcherUtils.detectSwipeGesture(startX, endX, locale, callback)
```

## 📋 CONTROLLI UTENTE

### **🖱️ Interfaccia**
- **Click/Tap**: Bottone con bandiere 🇺🇸🇮🇩 in alto a destra
- **Dropdown**: Menu elegante con opzioni lingua

### **⌨️ Keyboard Shortcuts**
- **Alt + L**: Toggle rapido inglese ⇄ indonesiano
- **↑↓ Frecce**: Naviga opzioni menu
- **Enter**: Conferma selezione
- **Esc**: Chiudi menu

### **📱 Mobile Gestures**
- **Swipe Left**: Cambia a indonesiano 🇮🇩
- **Swipe Right**: Cambia a inglese 🇺🇸

## 🔧 CONFIGURAZIONE

### **Lingue Supportate**
- 🇺🇸 **English** (default)
- 🇮🇩 **Bahasa Indonesia**

### **Storage & Analytics**
```javascript
// Dati salvati automaticamente
localStorage.getItem('locale')              // 'en' | 'id'
localStorage.getItem('locale_timestamp')    // Date.now()
localStorage.getItem('locale_user_preference') // 'true'
```

### **Performance Config**
```javascript
const LANGUAGE_CONFIG = {
  GESTURE_THRESHOLD: 100,      // Soglia swipe
  ANIMATION: {
    TRANSITION_DURATION: 300,  // Durata transizioni
    PRELOADER_DELAY: 200       // Delay preloader
  }
}
```

## 📊 COMPATIBILITÀ

### **Browser Support**
- ✅ Chrome 90+
- ✅ Firefox 90+  
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Android Chrome)

### **Framework Integration**
- ✅ **React/Next.js**: Component nativo
- ✅ **HTML/JavaScript**: Libreria standalone
- ✅ **TypeScript**: Fully typed
- ✅ **Tailwind CSS**: Design system integrato

## 🧪 TESTING

### **Test Coverage**
- ✅ **Unit tests**: React components + utilities
- ✅ **Integration tests**: Cross-page persistence
- ✅ **E2E tests**: User workflows completi
- ✅ **Accessibility tests**: Screen reader compatibility
- ✅ **Performance tests**: Load time impact

### **Quality Assurance**
```bash
# Run test suite
npm test

# E2E testing  
npm run test:e2e

# Accessibility audit
npm run test:a11y
```

## 📚 DOCUMENTAZIONE

### **📖 Guide Complete**
- **[Architettura](docs/LANGUAGE_SWITCHER_ARCHITECTURE.md)**: Design system e overview tecnico
- **[Guida Utilizzo](docs/LANGUAGE_SWITCHER_USAGE_GUIDE.md)**: Per sviluppatori e utenti finali
- **[API Reference](shared/language-switcher-config.js)**: Configurazione e utilities

### **🔧 Configurazione**
- **[Shared Config](shared/language-switcher-config.js)**: Configurazione unificata
- **[React Component](components/language-switcher.tsx)**: Implementation React
- **[Vanilla JS](public/js/landing-i18n.js)**: Implementation HTML

## 🚀 ROADMAP

### **v2.1.0 - Optimizations**
- [ ] Service Worker per cache traduzioni
- [ ] URL params sync (?lang=id)  
- [ ] Auto-translate meta tags
- [ ] RTL support preparation

### **v2.2.0 - Advanced Features**
- [ ] Voice commands per cambio lingua
- [ ] Smart suggestions based on geolocation
- [ ] A/B testing per UX improvements
- [ ] Advanced analytics dashboard

## 💡 RISULTATO

**Sistema language switcher enterprise-grade** che garantisce:

🎯 **Continuità perfetta** tra sito principale e landing pages  
🚀 **Performance ottimizzate** per tutti i dispositivi  
♿ **Accessibilità enterprise** conforme agli standard  
📱 **Mobile-first design** con gesture avanzate  
🔧 **Configurazione centralizzata** per manutenzione facile  
📊 **Analytics integrate** per insights utenti  

---

**🌟 Powered by Bali Zero Development Team** | **📧 Contact**: info@balizero.com