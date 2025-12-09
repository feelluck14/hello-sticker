'use client'

import { supabase } from '@/lib/supabaseClient'

export async function getAnonymousId() {
  let anonId = localStorage.getItem('anon_id')
  if (!anonId) {
    anonId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    localStorage.setItem('anon_id', anonId)
    const { error } = await supabase.from('temp_info').insert([
      {
        id: anonId,
        lastmake_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ])
    if (error) {
      console.error(`❌ 비로그인 유저 저장 실패: ${error.message}`)
      return null
    }
    console.log('✅ 유저임시등록 완료!')
  }
  return anonId
}

export const handleupload = async (upload_file: File | null, bucket: string, userinfo: any | null) => {
  if (!upload_file) return ''
  const fileExt = upload_file.name.split('.').pop()
  const userPrefix = userinfo?.id || localStorage.getItem('anon_id') || 'anon'
  const fileName = `${userPrefix}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: storageError } = await supabase.storage
    .from(bucket + '_img')
    .upload(filePath, upload_file, {
      cacheControl: '3600',
      upsert: false,
      contentType: upload_file.type,
    })

  if (storageError) {
    console.error(`❌ 이미지 저장 실패: ${storageError.message}`)
    return ''
  }

  const { data: publicUrlData } = supabase.storage.from(bucket + '_img').getPublicUrl(filePath)
  return publicUrlData.publicUrl
}
