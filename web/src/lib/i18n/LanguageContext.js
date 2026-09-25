'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getDictionary } from './index'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('agrovani_locale')
    if (saved) setLocale(saved)
  }, [])

  const changeLocale = (nextLocale) => {
    setLocale(nextLocale)
    localStorage.setItem('agrovani_locale', nextLocale)
  }

  return <LanguageContext.Provider value={{ locale, setLocale: changeLocale, t: getDictionary(locale) }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}