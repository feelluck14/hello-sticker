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
  const [isCreatingUserInfo, setIsCreatingUserInfo] = useState(false)
  const router = useRouter()

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      // 2. user_info 테이블에서 추가 정보 가져오기
      const { data, error } = await supabase
        .from('users_info')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('user_info 조회 실패:', error.message)
      } else {
        // 일반 로그인 시에만 생성, OAuth는 onAuthStateChange에서 처리
        if (!data || data.length === 0) {
          console.log('일반 로그인: 유저 정보가 없어 생성합니다...')
          await createUserInfo(user)
        } else {
          setUserInfo(data[0])
        }
      }
    } else {
      setUserInfo(null)
    }
    setLoading(false)
  }

  const createUserInfo = async (user: any) => {
    // 이미 생성 중이면 중복 실행 방지
    if (isCreatingUserInfo) {
      console.log('유저 정보 생성이 이미 진행 중입니다.')
      return
    }

    setIsCreatingUserInfo(true)

    try {
      // 생성 전에 다시 한 번 확인 (.single()로 정확한 확인)
      const { data: existingData, error: checkError } = await supabase
        .from('users_info')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때의 정상 에러
        console.error('유저 정보 존재 확인 오류:', checkError)
        return
      }

      if (existingData) {
        console.log('유저 정보가 이미 존재합니다.')
        setUserInfo(existingData)
        return
      }

      // 난수 닉네임 생성
      let nickname;
      let exists = true;
      let attempts = 0;
      const maxAttempts = 10;

      while (exists && attempts < maxAttempts) {
        nickname = "user_" + Math.random().toString(36).substring(2, 8);
        
        const { data, error: checkError } = await supabase
          .from("users_info")
          .select("nickname")
          .eq("nickname", nickname);

        if (checkError) {
          console.error('닉네임 중복 체크 오류:', checkError)
          return;
        }

        exists = data && data.length > 0;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error('닉네임 생성 실패: 최대 시도 횟수 초과')
        return;
      }

      // 유저 정보 생성
      const { error: insertError } = await supabase.from('users_info').insert({
        user_id: user.id,
        email: user.email,
        username: user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
        nickname: nickname,
        created_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error('유저 정보 생성 실패:', insertError)
      } else {
        console.log('유저 정보 생성 완료')
        // 생성한 데이터를 직접 사용
        const newUserInfo = {
          user_id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
          nickname: nickname,
          phone: null,
          birth: null,
          created_at: new Date().toISOString(),
        }
        setUserInfo(newUserInfo)
      }
    } catch (error) {
      console.error('유저 정보 생성 중 오류:', error)
    } finally {
      setIsCreatingUserInfo(false)
    }
  }

  useEffect(() => {
    // OAuth 로그인의 경우 onAuthStateChange에서 처리하므로 getUser() 생략
    // getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setUserInfo(null)
        router.push('/auth') // 세션 만료 시 로그인 페이지로 이동
      } else {
        setUser(session.user)
        // 세션이 있으면 (INITIAL_SESSION 포함) 사용자 정보를 가져와 설정
        if (session.user) {
          try {
            const { data, error } = await supabase
              .from('users_info')
              .select('*')
              .eq('user_id', session.user.id)

            if (error) {
              console.error('user_info 조회 실패:', error.message)
              setUserInfo(null)
            } else if (!data || data.length === 0) {
              console.log('세션 확인: 유저 정보가 없어 생성합니다...')
              await createUserInfo(session.user)
            } else {
              console.log('세션 확인: 기존 유저 정보 사용')
              setUserInfo(data[0])
            }
          } catch (err) {
            console.error('onAuthStateChange에서 유저 정보 처리 중 오류:', err)
            setUserInfo(null)
          }
        }
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
          console.log('로그아웃 시작')
          try {
            // 상태 초기화
            setUser(null)
            setUserInfo(null)
            
            // Supabase 로그아웃
            const { error } = await supabase.auth.signOut()
            if (error) {
              console.error('Supabase 로그아웃 실패:', error)
            }
            
            // 로컬 스토리지 클리어
            if (typeof window !== 'undefined') {
              localStorage.clear()
              sessionStorage.clear()
            }
            
            // 약간의 지연 후 리다이렉트
            setTimeout(() => {
              router.push('/auth')
            }, 100)
          } catch (error) {
            console.error('로그아웃 중 오류:', error)
            // 오류가 발생해도 강제 리다이렉트
            setUser(null)
            setUserInfo(null)
            setTimeout(() => {
              router.push('/auth')
            }, 100)
          }
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