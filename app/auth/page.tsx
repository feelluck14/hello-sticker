'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { useI18n } from '@/components/I18nContext'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const { userinfo, loading,login } = useAuth()
  const [username, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [birth, setBirthdate] = useState('')
  const [nickname, setNickname] = useState('')
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState(false)
  const router = useRouter()
  const { t } = useI18n()
  // 로그인 상태 확인
  useEffect(() => {
    if (userinfo) {
      router.push('/')
    }
  }, [])

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://192.168.0.12:3000/' // 개발 환경일 경우
      }
    })
    
    if (error) {
      console.error('로그인 실패:', error.message)
      alert('로그인 실패: ' + error.message)
    }
    // 성공 시에는 OAuth 리다이렉트가 발생하고, AuthContext에서 유저 정보 처리를 자동으로 수행
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(`❌ 로그인 실패: ${error.message}`)
    } else {
      setMessage('✅ 로그인 성공!')
      // rememberMe가 true면 로컬 스토리지에 저장
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }
      login && await login()
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!nicknameChecked || !nicknameAvailable) {
    alert('닉네임 중복 체크를 완료해주세요.')
    setMessage('닉네임 중복 체크를 완료해주세요.')
    return
  }

  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username, phone, gender, birth, nickname }),
  })

  const data = await res.json()

  if (data.error) {
    setMessage(`❌ 회원가입 실패: ${data.error}`)
  } else {
    setMessage('✅ 회원가입 성공! 이메일 인증을 완료해주세요.')
    setMode('login')
    setEmail('')
    setPassword('')
    setName('')
    setPhone('')
    setGender('')
    setBirthdate('')
    setNickname('')
    setNicknameChecked(false)
    setNicknameAvailable(false)
    setNickname('')
    setNicknameChecked(false)
    setNicknameAvailable(false)
  }
}

  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.')
      setMessage('닉네임을 입력해주세요.')
      return
    }

    const res = await fetch('/api/check-nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    })

    const data = await res.json()

    if (data.available) {
      alert('✅ 사용 가능한 닉네임입니다.')
      setMessage('✅ 사용 가능한 닉네임입니다.')
      setNicknameChecked(true)
      setNicknameAvailable(true)
    } else {
      alert('❌ 이미 사용중인 닉네임입니다.')
      setMessage('❌ 이미 사용중인 닉네임입니다.')
      setNicknameChecked(true)
      setNicknameAvailable(false)
    }
  }
  return (
    <div style={{
  maxWidth: 400,
  margin: '40px auto',
  padding: '30px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  backgroundColor: '#fff',
  color:'black'
}}>
  <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
    {mode === 'login' ? t('auth.login') : t('auth.signup')}
  </h2>

  <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <label>
      {t('auth.email')}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
    </label>

    <label>
      {t('auth.password')}
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
    </label>
    {mode === 'login' && (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          />
          {t('auth.rememberMe')}
      </label>
    )}
    {mode === 'signup' && (
      <>
        <label>
          {t('auth.nickname')}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={nickname} onChange={(e) => { setNickname(e.target.value); setNicknameChecked(false); setNicknameAvailable(false); }} required />
            <button type="button" onClick={handleCheckNickname} style={{
              padding: '8px 12px',
              backgroundColor: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              {t('auth.checkDuplicate')}
            </button>
          </div>
        </label>

        <label>
          {t('auth.name')}
          <input value={username} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          {t('auth.phone')}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <label>
          {t('auth.gender')}
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">{t('auth.select')}</option>
            <option value="male">{t('auth.male')}</option>
            <option value="female">{t('auth.female')}</option>
          </select>
        </label>

        <label>
          {t('auth.birth')}
          <input type="date" value={birth} onChange={(e) => setBirthdate(e.target.value)} />
        </label>
      </>
    )}

    <button type="submit" style={{
      padding: '10px',
      backgroundColor: '#4f46e5',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}>
      {mode === 'login' ? t('auth.login') : t('auth.signup')}
    </button>
  </form>

  <p style={{ marginTop: 20, textAlign: 'center' }}>{message}</p>

  <div style={{ marginTop: 20, textAlign: 'center' }}>
    {mode === 'login' ? (
      <p>
        {t('auth.noAccount')}{' '}
        <button onClick={() => setMode('signup')} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>
          {t('auth.signupLink')}
        </button>
      </p>
    ) : (
      <p>
        {t('auth.hasAccount')}{' '}
        <button onClick={() => setMode('login')} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>
          {t('auth.loginLink')}
        </button>
        
      </p>
    )}
  </div>

  {/* 구글 로그인 버튼 - 별도 섹션 */}
  <div style={{ marginTop: '30px', textAlign: 'center' }}>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      margin: '20px 0',
      color: '#666',
      fontSize: '14px'
    }}>
      <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
      <span style={{ padding: '0 10px' }}>또는</span>
      <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
    </div>
    
    <button 
      onClick={handleGoogleLogin}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        maxWidth: '400px',
        padding: '12px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#333',
        transition: 'background-color 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {t('auth.googleLogin')}
    </button>
  </div>
</div>
  )
}