"use client"

import { useState, useEffect } from "react"
import { type Locale } from "@/lib/i18n"

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

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    if (onLocaleChange) {
      onLocaleChange(newLocale)
    }
    setIsOpen(false)
  }

  const languages = [
    { code: 'en' as Locale, name: 'English', flag: '🇺🇸' },
    { code: 'id' as Locale, name: 'Bahasa Indonesia', flag: '🇮🇩' }
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-off-white hover:text-gold transition-colors border border-white/10 rounded-lg hover:border-gold/30"
        aria-label="Change language"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:block">{currentLanguage.code.toUpperCase()}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
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
          />
          
          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-navy border border-white/10 rounded-lg shadow-2xl z-20 overflow-hidden">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLocaleChange(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors ${
                  locale === language.code 
                    ? 'bg-red/10 text-red border-l-2 border-red' 
                    : 'text-off-white'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {locale === language.code && (
                  <svg className="w-4 h-4 ml-auto text-red" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
            
            {/* Info */}
            <div className="px-4 py-2 border-t border-white/10 bg-white/5">
              <p className="text-xs text-white/60">
                Language preference is saved
              </p>
            </div>
          </div>
        </>
      )}
    </div>
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
    // Load saved locale from localStorage on mount
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'id')) {
      setLocale(savedLocale)
    }
  }, [])

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
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