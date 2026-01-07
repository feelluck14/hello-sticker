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

// WhatsApp 스티커용 이미지 변환 함수 (blob 반환)
export async function convertToStickerBlob(imageUrl: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // WhatsApp 스티커 크기: 256x256
      canvas.width = 256;
      canvas.height = 256;

      // 이미지 중앙에 맞춰서 리사이즈
      const aspectRatio = img.width / img.height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (aspectRatio > 1) {
        // 가로가 긴 경우
        drawWidth = 256;
        drawHeight = 256 / aspectRatio;
        offsetX = 0;
        offsetY = (256 - drawHeight) / 2;
      } else {
        // 세로가 긴 경우
        drawHeight = 256;
        drawWidth = 256 * aspectRatio;
        offsetX = (256 - drawWidth) / 2;
        offsetY = 0;
      }

      // 배경을 투명하게
      ctx.clearRect(0, 0, 256, 256);

      // 이미지 그리기
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // WebP로 변환
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/webp', 0.6);
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

// 모바일 기기 감지
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// WhatsApp 공유 URL 생성 (이미지 공유용)
export function generateWhatsAppShareUrl(imageUrl: string): string {
  const text = `Check out this sticker: ${imageUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
