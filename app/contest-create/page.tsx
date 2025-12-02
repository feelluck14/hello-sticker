'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function ContestCreatePage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const router = useRouter()

  const handleSubmit = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      alert('로그인이 필요합니다.')
      return
    }

    const authId = session.user.id
    // 1. user_info 테이블에서 해당 사용자 찾기
    const { data: userInfo, error: userInfoError } = await supabase
      .from('users_info')
      .select('id')
      .eq('user_id', authId)
      .single()

    if (userInfoError || !userInfo) {
      alert('사용자 정보가 없습니다.')
      return
    }
    const user_id = userInfo.id // contest_posts에 들어갈 int형 ID

    let imagePath = ''
    console.log('Submitting contest:', { user_id })
    // 이미지가 선택된 경우에만 업로드
    if (imageFile) {
      const fileName = `${authId}-${Date.now()}_${imageFile.name}`
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