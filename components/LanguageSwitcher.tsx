'use client'

import { useI18n } from './I18nContext'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  const switchLocale = (newLocale: string) => {
    setLocale(newLocale as 'ko' | 'en')
    localStorage.setItem('locale', newLocale)
  }

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="ml-4 p-1 border rounded"
    >
      <option value="ko">한국어</option>
      <option value="en">English</option>
    </select>
  )
}