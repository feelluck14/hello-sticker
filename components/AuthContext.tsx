'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  userinfo: any
  loading: boolean
  logout?: () => Promise<void>
  login?: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({ userinfo: null, loading: true ,logout: async () => {},login: async () => {}})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userinfo, setUserInfo] = useState<any>(null)
  const router = useRouter()

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      // 2. user_info 테이블에서 추가 정보 가져오기
      const { data, error } = await supabase
        .from('users_info')
        .select('*')
        .eq('user_id', user.id)   // user_info 테이블의 PK가 auth.users.id와 동일해야 함

      if (error) {
        console.error('user_info 조회 실패:', error.message)
      } else {
        setUserInfo(data?.[0] || null)
      }
    } else {
      setUserInfo(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        router.push('/auth') // 세션 만료 시 로그인 페이지로 이동
      } else {
        setUser(session.user)
      }
      setLoading(false)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        userinfo,
        loading,
        logout: async () => {
          await supabase.auth.signOut()
          setUser(null)
          setUserInfo(null)
          router.push('/')
        },        
        login: async () => {
          await getUser()
          router.push('/')
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)