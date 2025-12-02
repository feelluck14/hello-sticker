'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import Image from 'next/image'


export default function Header() {
  const { userinfo,loading,logout  } = useAuth()
  const router = useRouter()

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
        이모티콘 만들기
      </Link>

      {userinfo ? (
        <div className="flex gap-4">
          <Link href="/mypage">마이페이지</Link>
          <button onClick={logout}>로그아웃</button>
        </div>
      ) : (
        <Link href="/auth">로그인</Link>
      )}
    </header>
  )
}