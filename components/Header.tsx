'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import Image from 'next/image'
import { useI18n } from './I18nContext';
import LanguageSwitcher from './LanguageSwitcher';


export default function Header() {
  const { userinfo,loading,logout  } = useAuth()
  const router = useRouter()
  const { t } = useI18n()

  if (loading) {
    return (
      <header className="w-full flex justify-center p-4 border-b">
        {/* 로딩 중일 때는 아무것도 안 보여주거나 스피너 */}
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-opacity-50"></div>
      </header>
    )
  }

  return (
    <header className="w-full flex justify-between items-center p-4 border-b">
      <Link href="/" className="text-lg font-bold text-gray-800 hover:text-blue-600 transition">
        {t('nav.title')}
      </Link>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {userinfo ? (
          <div className="flex gap-4">
            <Link href="/my-page">{t('nav.myPage')}</Link>
            <button onClick={async () => {
              if (logout) {
                await logout()
              }
            }}>{t('nav.logout')}</button>
          </div>
        ) : (
          <Link href="/auth">{t('nav.login')}</Link>
        )}
      </div>
    </header>
  )
}