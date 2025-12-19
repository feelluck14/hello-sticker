'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'

export default function ContestCreatePage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const { userinfo, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (loading) return; // 아직 로딩 중이면 실행하지 않음
    if (!userinfo) {
      alert('로그인이 필요합니다.');
      router.push('/auth');
    }
  }, [loading, userinfo]);

  const handleSubmit = async () => {
    
    if (!userinfo) {
      alert('사용자 정보가 없습니다. 새로고침 후 다시 시도해주세요.')
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
        alert('이미지 업로드 실패')
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
      alert('게시글 등록 실패')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">새로운 대회 만들기</h1>

      <label className="block mb-2 font-semibold">제목</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border px-3 py-2 mb-4 rounded"
        placeholder="제목을 입력하세요"
      />

      <label className="block mb-2 font-semibold">이미지 (선택)</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <label className="block mb-2 font-semibold">본문</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full border px-3 py-2 mb-6 rounded"
        rows={6}
        placeholder="내용을 입력하세요"
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        등록하기
      </button>
    </div>
  )
}