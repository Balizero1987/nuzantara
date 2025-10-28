"use client"

import { useState, useEffect, useRef } from "react"
import { type Locale } from "@/lib/i18n"
import { LANGUAGE_CONFIG, SHARED_TRANSLATIONS, LanguageSwitcherUtils } from "@/shared/language-switcher-config"

interface LanguageSwitcherProps {
  currentLocale?: Locale
  onLocaleChange?: (locale: Locale) => void
  className?: string
}

export function LanguageSwitcher({ 
  currentLocale = 'en',
  onLocaleChange,
  className = ""
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showPreloader, setShowPreloader] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleLocaleChange = async (newLocale: Locale) => {
    if (isTransitioning || newLocale === locale) return
    
    setIsTransitioning(true)
    setShowPreloader(true)
    
    // Visual feedback
    document.body.classList.add('lang-transitioning')
    
    // Smooth transition delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    setLocale(newLocale)
    if (onLocaleChange) {
      onLocaleChange(newLocale)
    }
    setIsOpen(false)
    
    // Complete transition
    await new Promise(resolve => setTimeout(resolve, 300))
    setShowPreloader(false)
    document.body.classList.remove('lang-transitioning')
    setIsTransitioning(false)
  }

  // Unified translations from shared config
  const t = LanguageSwitcherUtils.getTranslations(locale, 'languageSwitcher')
  
  const languages = [
    { code: 'en' as Locale, name: t.english, flag: '🇺🇸' },
    { code: 'id' as Locale, name: t.indonesian, flag: '🇮🇩' }
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  // Setup effects for enhanced functionality
  useEffect(() => {
    setupKeyboardShortcuts()
    setupGestureHandlers()
    setupAccessibility()
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard shortcuts using shared config
  const handleKeyDown = (e: KeyboardEvent) => {
    // Alt + L: Toggle language
    if (e.altKey && e.key.toLowerCase() === LANGUAGE_CONFIG.SHORTCUTS.TOGGLE) {
      e.preventDefault()
      const newLocale = locale === 'en' ? 'id' : 'en'
      handleLocaleChange(newLocale)
    }
    
    // Escape: Close dropdown
    if (e.key === LANGUAGE_CONFIG.SHORTCUTS.ESCAPE) {
      setIsOpen(false)
    }
    
    // Arrow navigation in dropdown
    if (isOpen && (e.key === LANGUAGE_CONFIG.SHORTCUTS.ARROW_DOWN || e.key === LANGUAGE_CONFIG.SHORTCUTS.ARROW_UP)) {
      e.preventDefault()
      // Handle focus navigation here
    }
  }

  // Touch gestures
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX
    handleGesture()
  }

  const handleGesture = () => {
    // Use shared gesture detection utility
    LanguageSwitcherUtils.detectSwipeGesture(
      touchStartX.current, 
      touchEndX.current, 
      locale, 
      handleLocaleChange
    )
  }

  const setupKeyboardShortcuts = () => {
    document.addEventListener('keydown', handleKeyDown)
  }

  const setupGestureHandlers = () => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  const setupAccessibility = () => {
    // ARIA labels will be added inline in JSX
  }

  return (
    <>
      {/* Preloader */}
      {showPreloader && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-navy border border-gold/30 rounded-lg p-6 flex items-center gap-3 shadow-2xl">
            <div className="w-6 h-6 border-2 border-transparent border-t-gold rounded-full animate-spin"></div>
            <span className="text-off-white font-medium">{t.switching}</span>
          </div>
        </div>
      )}
      
      <div ref={dropdownRef} className={`relative ${className} ${isTransitioning ? 'opacity-75 scale-95' : ''} transition-all duration-300`}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isTransitioning}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-off-white hover:text-gold transition-all duration-300 border border-white/10 rounded-lg hover:border-gold/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-navy active:scale-95 min-h-[44px] touch-manipulation"
          aria-label={`${t.currentLanguage}: ${currentLanguage.name}. ${t.tip}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="text-lg" role="img" aria-label={`Flag of ${currentLanguage.name}`}>
            {currentLanguage.flag}
          </span>
          <span className="hidden sm:block font-semibold">
            {currentLanguage.code.toUpperCase()}
          </span>
          <svg 
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            {/* Menu */}
            <div 
              className="absolute top-full right-0 mt-2 w-56 sm:w-48 bg-navy border border-white/10 rounded-lg shadow-2xl z-20 overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200"
              role="menu"
              aria-label="Language selection menu"
            >
              {languages.map((language, index) => (
                <button
                  key={language.code}
                  onClick={() => handleLocaleChange(language.code)}
                  disabled={isTransitioning}
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 focus:bg-white/10 focus:outline-none transition-colors duration-200 min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                    locale === language.code 
                      ? 'bg-gold/10 text-gold border-l-4 border-gold' 
                      : 'text-off-white'
                  }`}
                  aria-current={locale === language.code ? 'true' : 'false'}
                >
                  <span className="text-lg" role="img" aria-label={`Flag of ${language.name}`}>
                    {language.flag}
                  </span>
                  <span className="font-medium flex-1">{language.name}</span>
                  {locale === language.code && (
                    <svg 
                      className="w-4 h-4 text-gold" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              
              {/* Info */}
              <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                <p className="text-xs text-white/60 leading-relaxed">
                  💡 {t.tip.replace('Alt+L', '')} <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs font-mono">Alt+L</kbd>
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {t.saving}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// Context for managing locale across the app
import { createContext, useContext } from "react"

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  setLocale: () => {}
})

export function LocaleProvider({ 
  children, 
  initialLocale = 'en' 
}: { 
  children: React.ReactNode
  initialLocale?: Locale 
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  useEffect(() => {
    // Use shared locale loading logic
    const detectedLocale = LanguageSwitcherUtils.loadLocale() as Locale
    setLocale(detectedLocale)
  }, [])

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    // Use shared save logic with analytics
    LanguageSwitcherUtils.saveLocale(newLocale, true)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}