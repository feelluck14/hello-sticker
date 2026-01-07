'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { useI18n } from '@/components/I18nContext'

export default function ContestCreatePage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const { userinfo, loading } = useAuth()
  const router = useRouter()
  const { t } = useI18n()
  useEffect(() => {
    if (loading) return; // 아직 로딩 중이면 실행하지 않음
    if (!userinfo) {
      alert(t('contestCreate.loginRequired'));
      router.push('/auth');
    }
  }, [loading, userinfo]);

  const handleSubmit = async () => {
    
    if (!userinfo) {
      alert(t('contestCreate.noUserInfo'))
      return
    }
    const user_id = userinfo.user_id // contest_posts에 들어갈 int형 ID

    let imagePath = ''
    // 이미지가 선택된 경우에만 업로드
    if (imageFile) {
      const fileName = `${user_id}-${Date.now()}_${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('contest_img')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        alert(t('contestCreate.uploadFail'))
        return
      }
      const { data: publicUrlData } = supabase.storage
      .from('contest_img')
      .getPublicUrl(fileName)
      imagePath =  publicUrlData.publicUrl
    }

    const { error: insertError } = await supabase.from('contest_posts').insert([
      {
        user_id,
        title,
        image: imagePath || null, // 이미지가 없으면 null로 처리
        body,
      },
    ])

    if (insertError) {
      console.error(insertError)
      alert(t('contestCreate.postFail'))
    } else {
      router.push('/')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{t('contestCreate.title')}</h1>

      <label className="block mb-2 font-semibold">{t('contestCreate.titleLabel')}</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border px-3 py-2 mb-4 rounded"
        placeholder={t('contestCreate.titlePlaceholder')}
      />

      <label className="block mb-2 font-semibold">{t('contestCreate.imageLabel')}</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <label className="block mb-2 font-semibold">{t('contestCreate.bodyLabel')}</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full border px-3 py-2 mb-6 rounded"
        rows={6}
        placeholder={t('contestCreate.bodyPlaceholder')}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {t('contestCreate.submit')}
      </button>
    </div>
  )
}