# BALI ZERO LANGUAGE SWITCHER - ARCHITETTURA UNIFICATA

> **Versione 2.0.0** - Sistema di traduzione enterprise per tutto l'ecosistema balizero.com

## 🏗️ ARCHITETTURA OVERVIEW

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
    ├── Colori: vivid-black, gold, cream, navy
    ├── Tipografia: Playfair (serif) + Inter (sans)
    └── Animazioni: smooth transitions + accessibility
```

## 🎯 CONTINUITÀ GARANTITA

### **1. Configurazione Unificata**
- ✅ **Config condivisa**: `shared/language-switcher-config.js`
- ✅ **Traduzioni centralizate**: SHARED_TRANSLATIONS
- ✅ **Stili sincronizzati**: SHARED_STYLES
- ✅ **Utilità comuni**: LanguageSwitcherUtils class

### **2. Comportamento Identico**
- ✅ **Keyboard shortcuts**: Alt+L su tutto il sito
- ✅ **Gesture swipe**: Left/Right swipe funziona ovunque  
- ✅ **Auto-detect**: Rileva lingua browser al primo accesso
- ✅ **Persistence**: localStorage sincronizzato
- ✅ **Analytics**: Timestamp e tracking unificato

### **3. Design System Coerente**
- ✅ **Posizione fissa**: Top-right (20px, 20px) ovunque
- ✅ **Colori brand**: Gold accent, navy background 
- ✅ **Animazioni**: Smooth transitions identiche
- ✅ **Accessibility**: ARIA labels + focus management
- ✅ **Mobile**: 44px touch targets + responsive

## 🚀 IMPLEMENTAZIONI

### **Main Site (React/Next.js)**
```typescript
// components/language-switcher.tsx
import { LANGUAGE_CONFIG, LanguageSwitcherUtils } from '@/shared/language-switcher-config'

export function LanguageSwitcher() {
  // Auto-detect + persistence
  const locale = LanguageSwitcherUtils.loadLocale()
  
  // Unified gesture handling  
  const handleGesture = () => {
    LanguageSwitcherUtils.detectSwipeGesture(
      touchStartX, touchEndX, locale, handleLocaleChange
    )
  }
  
  // Shared translations
  const t = LanguageSwitcherUtils.getTranslations(locale)
}
```

### **Landing Pages (Vanilla JS)**
```javascript
// public/js/landing-i18n.js  
import { LANGUAGE_CONFIG, SHARED_TRANSLATIONS, LanguageSwitcherUtils } 
  from '/shared/language-switcher-config.js'

class LanguageSwitcher {
  constructor() {
    // Same auto-detect logic
    this.currentLocale = LanguageSwitcherUtils.loadLocale()
    
    // Same gesture handling
    this.setupGestureHandlers()
    
    // Same translations
    this.translations = SHARED_TRANSLATIONS
  }
}
```

## 📱 FUNZIONALITÀ UNIFICATE

### **🎨 UX/Performance**
- **Lazy loading**: IntersectionObserver per immagini
- **Smooth transitions**: Blur effects durante cambio lingua
- **Preloader elegante**: Spinner con backdrop-blur
- **Cache intelligente**: Persistence + analytics timestamp

### **♿ Accessibility** 
- **Screen readers**: ARIA completo (labels, roles, states)
- **Keyboard navigation**: Alt+L, frecce, ESC, Enter
- **High contrast**: Support automatico
- **Reduced motion**: Rispetta preferenze utente
- **Touch targets**: Minimum 44px per mobile

### **📱 Mobile Optimization**
- **Gesture swipe**: Left/Right per cambio lingua
- **Position adaptive**: Fixed ma responsive  
- **Touch feedback**: Scale animation su tap
- **Performance**: Throttled events + passive listeners

## 🔧 CONFIGURAZIONE CENTRALIZZATA

### **Shared Config (`shared/language-switcher-config.js`)**
```javascript
export const LANGUAGE_CONFIG = {
  SUPPORTED_LOCALES: ['en', 'id'],
  DEFAULT_LOCALE: 'en',
  GESTURE_THRESHOLD: 100,
  ANIMATION: {
    TRANSITION_DURATION: 300,
    PRELOADER_DELAY: 200
  }
}

export const SHARED_TRANSLATIONS = {
  en: { nav: {...}, actions: {...}, sections: {...} },
  id: { nav: {...}, actions: {...}, sections: {...} }
}
```

### **Utilità Condivise**
```javascript
export class LanguageSwitcherUtils {
  static detectBrowserLanguage()  // Auto-detect lingua
  static loadLocale()             // Load con fallback
  static saveLocale(locale)       // Save + analytics
  static getTranslations(locale)  // Get traduzioni
  static detectSwipeGesture()     // Handle gestures
}
```

## 🎯 TESTING & QA

### **Checklist Continuità**
- [ ] **Visual consistency**: Stesso design su main + landing
- [ ] **Behavioral consistency**: Stessi shortcuts ovunque
- [ ] **Data consistency**: Stesso localStorage
- [ ] **Performance consistency**: Stesse ottimizzazioni
- [ ] **A11y consistency**: Stesso livello accessibilità

### **Test Cross-Platform** 
```bash
# Test main site
curl https://balizero.com | grep "language-switcher"

# Test landing pages  
curl https://balizero.com/landing%20page/welcome-visas-page.html | grep "landing-i18n.js"

# Test mobile gestures
# Swipe test su device reali iOS/Android

# Test keyboard shortcuts
# Alt+L test su browser diversi
```

## 📊 ANALYTICS & MONITORING

### **Metriche Unificate**
- **Language preferences**: EN vs ID usage
- **Gesture usage**: Swipe vs click vs keyboard  
- **Performance**: Transition timings
- **Accessibility**: Screen reader usage
- **Mobile**: Touch vs desktop usage

### **Tracking Implementation**
```javascript
// Tracking centralizzato
LanguageSwitcherUtils.saveLocale(locale, true) // isUserAction=true
localStorage.setItem('locale_method', 'swipe|click|keyboard')
localStorage.setItem('locale_timestamp', Date.now())
```

## 🚀 ROADMAP

### **v2.1.0 - Optimizations**
- [ ] Service Worker per cache traduzioni
- [ ] URL params sync (?lang=id)
- [ ] Auto-translate meta tags
- [ ] RTL support preparation

### **v2.2.0 - Advanced Features**  
- [ ] Voice commands per cambio lingua
- [ ] Smart suggestions based on location
- [ ] A/B testing per UX improvements
- [ ] Advanced analytics dashboard

## 📚 RISORSE

- **Config centrale**: `/shared/language-switcher-config.js`
- **React component**: `/components/language-switcher.tsx`  
- **Vanilla JS**: `/public/js/landing-i18n.js`
- **Stili globali**: `/app/globals.css`
- **Documentazione**: `/docs/LANGUAGE_SWITCHER_*.md`

---

**💡 Risultato**: Sistema language switcher enterprise-grade con continuità completa tra tutto l'ecosistema balizero.com - dal sito principale alle landing pages, con design unificato, comportamento identico e performance ottimizzate.