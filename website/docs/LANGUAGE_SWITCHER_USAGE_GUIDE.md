# BALI ZERO LANGUAGE SWITCHER - GUIDA ALL'USO

> **Versione 2.0.0** - Guida completa per sviluppatori e utenti finali

## 🚀 QUICK START

### **Per Sviluppatori**

#### **1. Aggiungere al Sito Principale (React/Next.js)**
```tsx
import { LanguageSwitcher } from '@/components/language-switcher'

export default function Header() {
  return (
    <header>
      <nav>
        {/* Altri elementi nav */}
        <LanguageSwitcher className="ml-auto" />
      </nav>
    </header>
  )
}
```

#### **2. Aggiungere alle Landing Pages (HTML)**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Altri meta tags -->
</head>
<body>
  <!-- Contenuto pagina -->
  
  <!-- Language switcher script - SEMPRE prima del closing body -->
  <script src="/js/landing-i18n.js"></script>
</body>
</html>
```

#### **3. Configurazione Condivisa**
```javascript
// shared/language-switcher-config.js
export const LANGUAGE_CONFIG = {
  SUPPORTED_LOCALES: ['en', 'id'],
  DEFAULT_LOCALE: 'en',
  GESTURE_THRESHOLD: 100,
  // ... altre configurazioni
}
```

## 📱 GUIDA UTENTE FINALE

### **Come Cambiare Lingua**

#### **🖱️ Click/Tap**
1. Cerca il bottone con le bandiere 🇺🇸🇮🇩 in alto a destra
2. Clicca/tocca il bottone
3. Seleziona la lingua desiderata dal menu

#### **⌨️ Keyboard Shortcuts**
- **Alt + L**: Toggle rapido tra inglese e indonesiano
- **Frecce ↑↓**: Naviga nelle opzioni (quando menu aperto)
- **Enter**: Conferma selezione
- **Esc**: Chiudi menu

#### **📱 Mobile Gestures**
- **Swipe Left**: Cambia a indonesiano 🇮🇩
- **Swipe Right**: Cambia a inglese 🇺🇸
- **Funziona ovunque**: Su qualsiasi pagina del sito

### **Funzionalità Automatiche**
- ✅ **Auto-detect**: Rileva lingua browser al primo accesso
- ✅ **Memoria**: Ricorda la tua preferenza
- ✅ **Sync**: Stessa lingua su tutto il sito
- ✅ **Responsive**: Ottimizzato per mobile e desktop

## 🔧 CONFIGURAZIONE AVANZATA

### **Personalizzare Traduzioni**

#### **Aggiungere Nuove Stringhe**
```javascript
// shared/language-switcher-config.js
export const SHARED_TRANSLATIONS = {
  en: {
    // Sezioni esistenti...
    newSection: {
      title: "New Title",
      description: "New description"
    }
  },
  id: {
    // Sezioni esistenti...
    newSection: {
      title: "Judul Baru", 
      description: "Deskripsi baru"
    }
  }
}
```

#### **Usare le Traduzioni**

**In React:**
```tsx
import { useLocale } from '@/components/language-switcher'
import { getTranslations } from '@/lib/i18n'

export function MyComponent() {
  const { locale } = useLocale()
  const t = getTranslations(locale)
  
  return <h1>{t.newSection.title}</h1>
}
```

**In JavaScript Vanilla:**
```javascript
// In landing pages
const t = translations[this.currentLocale]
document.querySelector('.title').textContent = t.newSection.title
```

### **Personalizzare Stili**

#### **Override CSS**
```css
/* app/globals.css */
#languageSwitcher {
  /* Cambia posizione */
  top: 10px !important;
  right: 10px !important;
  
  /* Cambia colori */
  --gold: #your-color !important;
}

.language-btn {
  /* Personalizza bottone */
  background: your-background !important;
  border-color: your-border !important;
}
```

#### **Responsive Customization**
```css
@media (max-width: 768px) {
  #languageSwitcher {
    top: 5px !important;
    right: 5px !important;
  }
  
  .language-btn {
    font-size: 0.75rem !important;
    padding: 0.5rem !important;
  }
}
```

## 📊 ANALYTICS & TRACKING

### **Metriche Disponibili**

#### **localStorage Data**
```javascript
// Controllare preferenze utente
const locale = localStorage.getItem('locale')              // 'en' | 'id'
const timestamp = localStorage.getItem('locale_timestamp') // Date.now()
const autoDetected = localStorage.getItem('locale_auto_detected') // 'true'
const userPref = localStorage.getItem('locale_user_preference')   // 'true'
```

#### **Tracking Events**
```javascript
// Custom analytics integration
document.addEventListener('languageChanged', (e) => {
  const { newLocale, oldLocale, method } = e.detail
  
  // Send to your analytics
  analytics.track('Language Changed', {
    from: oldLocale,
    to: newLocale,
    method: method, // 'click' | 'keyboard' | 'swipe'
    timestamp: Date.now()
  })
})
```

### **Performance Monitoring**
```javascript
// Measure language switch performance
performance.mark('language-switch-start')
// ... language switch happens
performance.mark('language-switch-end')
performance.measure('language-switch', 'language-switch-start', 'language-switch-end')
```

## 🧪 TESTING

### **Unit Tests**

#### **React Component Testing**
```tsx
import { render, fireEvent } from '@testing-library/react'
import { LanguageSwitcher } from '@/components/language-switcher'

test('should toggle language on Alt+L', () => {
  render(<LanguageSwitcher />)
  
  fireEvent.keyDown(document, { 
    key: 'l', 
    altKey: true 
  })
  
  expect(localStorage.getItem('locale')).toBe('id')
})
```

#### **JavaScript Testing**
```javascript
// Test landing page functionality
describe('Landing Page Language Switcher', () => {
  test('should detect browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'id-ID'
    })
    
    const locale = LanguageSwitcherUtils.detectBrowserLanguage()
    expect(locale).toBe('id')
  })
})
```

### **E2E Testing**
```javascript
// Playwright/Cypress test
test('should work consistently across pages', async ({ page }) => {
  // Test main site
  await page.goto('https://balizero.com')
  await page.keyboard.press('Alt+l')
  expect(await page.localeStorage.getItem('locale')).toBe('id')
  
  // Test landing page  
  await page.goto('https://balizero.com/landing%20page/welcome-visas-page.html')
  expect(await page.localeStorage.getItem('locale')).toBe('id') // Should persist
})
```

## 🚨 TROUBLESHOOTING

### **Problemi Comuni**

#### **Language Switcher Non Appare**
1. **Verifica script inclusion**:
   ```html
   <!-- Per landing pages -->
   <script src="/js/landing-i18n.js"></script>
   ```

2. **Verifica CSS z-index**:
   ```css
   #languageSwitcher {
     z-index: 99999 !important;
   }
   ```

3. **Verifica errori console**:
   ```javascript
   // Abilita debug logging
   localStorage.setItem('language-switcher-debug', 'true')
   ```

#### **Traduzioni Non Funzionano**
1. **Verifica locale storage**:
   ```javascript
   console.log(localStorage.getItem('locale'))
   ```

2. **Verifica traduzioni disponibili**:
   ```javascript
   console.log(translations[currentLocale])
   ```

3. **Verifica selettori DOM**:
   ```javascript
   // In landing pages, verifica che i selettori esistano
   console.log(document.querySelector('.hero h1'))
   ```

#### **Performance Issues**
1. **Reduce motion preference**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

2. **Disable gestures on slow devices**:
   ```javascript
   // Auto-disable su dispositivi lenti
   if (navigator.hardwareConcurrency < 4) {
     // Disable gesture detection
   }
   ```

### **Debugging Tools**

#### **Debug Mode**
```javascript
// Enable debug logging
localStorage.setItem('bz-lang-debug', 'true')

// Logs will show:
// - Locale detection process
// - Translation lookups  
// - Gesture detection
// - Performance timings
```

#### **Visual Debug**
```css
/* Highlight language switcher */
#languageSwitcher {
  border: 3px solid red !important;
  background: yellow !important;
}
```

## 📚 RISORSE AVANZATE

### **API Reference**
- `LanguageSwitcherUtils.loadLocale()` - Carica locale con fallback
- `LanguageSwitcherUtils.saveLocale(locale, isUserAction)` - Salva con analytics
- `LanguageSwitcherUtils.detectSwipeGesture()` - Rileva gesture swipe
- `LanguageSwitcherUtils.getTranslations(locale, section)` - Get traduzioni

### **Configuration Reference**
- `LANGUAGE_CONFIG.SUPPORTED_LOCALES` - Lingue supportate
- `LANGUAGE_CONFIG.GESTURE_THRESHOLD` - Soglia per swipe gestures
- `LANGUAGE_CONFIG.ANIMATION.TRANSITION_DURATION` - Durata transizioni

### **Integration Examples**
- **Analytics**: Google Analytics, Mixpanel integration
- **A/B Testing**: Optimizely, VWO integration  
- **CMS**: Strapi, Contentful multilingual
- **SSG**: Next.js, Gatsby i18n routing

---

**💡 Supporto**: Per domande o problemi, consulta la documentazione completa in `/docs/LANGUAGE_SWITCHER_ARCHITECTURE.md` o apri un issue nel repository.