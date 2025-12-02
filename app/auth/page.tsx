'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const { userinfo, loading,login } = useAuth()
  const [username, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [birth, setBirthdate] = useState('')
  const router = useRouter()
  // 로그인 상태 확인
  useEffect(() => {
    if (userinfo) {
      router.push('/')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(`❌ 로그인 실패: ${error.message}`)
    } else {
      setMessage('✅ 로그인 성공!')
      login && await login()
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()

  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username, phone, gender, birth }),
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
    {mode === 'login' ? '로그인' : '회원가입'}
  </h2>

  <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <label>
      이메일
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
    </label>

    <label>
      비밀번호
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
    </label>

    {mode === 'signup' && (
      <>
        <label>
          이름
          <input value={username} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          휴대폰번호
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <label>
          성별
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">선택</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </label>

        <label>
          생년월일
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
      {mode === 'login' ? '로그인' : '회원가입'}
    </button>
  </form>

  <p style={{ marginTop: 20, textAlign: 'center' }}>{message}</p>

  <div style={{ marginTop: 20, textAlign: 'center' }}>
    {mode === 'login' ? (
      <p>
        계정이 없으신가요?{' '}
        <button onClick={() => setMode('signup')} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>
          회원가입
        </button>
      </p>
    ) : (
      <p>
        이미 계정이 있으신가요?{' '}
        <button onClick={() => setMode('login')} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>
          로그인
        </button>
      </p>
    )}
  </div>
</div>
  )
}