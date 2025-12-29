import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  const { nickname } = await req.json()

  if (!nickname) {
    return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 })
  }

  // users_info 테이블에서 nickname 중복 확인
  const { data, error } = await supabase
    .from('users_info')
    .select('nickname')
    .eq('nickname', nickname)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때의 에러
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data) {
    return NextResponse.json({ available: false, message: '이미 사용중인 닉네임입니다.' }, { status: 200 })
  } else {
    return NextResponse.json({ available: true, message: '사용 가능한 닉네임입니다.' }, { status: 200 })
  }
}