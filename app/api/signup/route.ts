import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  const { email, password, username, phone, gender, birth } = await req.json()

  // 1. 회원가입
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signupError || !signupData.user) {
    return NextResponse.json({ error: signupError?.message }, { status: 400 })
  }

  const userId = signupData.user.id

  // 2. 추가 정보 저장
  const { error: insertError } = await supabase.from('users_info').insert([
    {
      user_id: userId,
      email: email,
      username: username,   
      phone: phone,
      gender: gender,
      birth:  birth,
    },
  ])

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ user: signupData.user }, { status: 200 })
}