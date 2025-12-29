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

export const handleupload = async (
  upload_file: File | null,
  bucket: string,
  userinfo: any | null
) => {
  if (!upload_file) return '';

  // 파일 확장자 안전 처리 (없으면 jpg 기본값)
  const fileExt = upload_file.name?.split('.').pop() || 'jpg';

  // contentType 기본값 설정 (모바일에서 비어 있을 수 있음)
  const contentType = upload_file.type || 'image/jpeg';

  // 사용자 prefix (로그인/비로그인 구분)
  const userPrefix = userinfo?.id || localStorage.getItem('anon_id') || 'anon';
  const fileName = `${userPrefix}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  try {
    // 업로드 시도
    const { error: storageError } = await supabase.storage
      .from(bucket + '_img')
      .upload(filePath, upload_file, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (storageError) {
      console.error(`❌ 이미지 저장 실패: ${storageError.message}`);
      alert(`❌ 업로드 실패: ${storageError.message}`); // 모바일에서도 알림 표시
      return '';
    }

    // 업로드 성공 → public URL 반환
    const { data: publicUrlData } = supabase.storage
      .from(bucket + '_img')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error('❌ 업로드 중 오류:', err);
    alert(`❌ 업로드 중 오류: ${err.message || err}`);
    return '';
  }
};
