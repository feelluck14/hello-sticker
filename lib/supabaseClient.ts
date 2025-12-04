import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // true면 브라우저 껐다 켜도 로그인 유지
    autoRefreshToken: true,      // access_token 만료되면 refresh_token으로 자동 갱신
    detectSessionInUrl: true,    // OAuth 리다이렉트 처리
  },
})