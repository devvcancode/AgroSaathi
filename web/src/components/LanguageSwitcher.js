'use client'

import { Globe } from 'lucide-react'
import { LOCALES } from '@/lib/i18n'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <div className="language-switcher" aria-label="Choose language">
      <Globe className="h-4 w-4 text-emerald-300" />
      {LOCALES.map((item) => (
        <button key={item.code} type="button" onClick={() => setLocale(item.code)} className={locale === item.code ? 'language-option language-option-active' : 'language-option'} aria-pressed={locale === item.code}>
          {item.label}
        </button>
      ))}
    </div>
  )
}