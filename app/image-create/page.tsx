'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter,useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'

export default function ImageCreatePage() {
  const { userinfo, loading } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const contestId = searchParams.get('board_id')
  useEffect(() => {
    
  }, [])


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setResultImage(null)
    }
  }
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  async function handleMake(user: any, isLogin: boolean) {
    if (isLogin) {
      // 로그인 유저
      const { data, error } = await supabase
        .from('users_info')
        .select('lastmake_at, makecount, maxcount')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error(error)
        return { success: false, message: '조회 실패' }
      }

      const lastDate = data.lastmake_at ? data.lastmake_at.split('T')[0] : null
      let makecount = data.makecount
      let maxcount = data.maxcount

      if (lastDate === today) {
        if (makecount < maxcount) {
          makecount += 1
        } else {
          return { success: false, message: '오늘 횟수 초과' }
        }
      } else {
        makecount = 1
      }

      await supabase.from('users_info').update({
        makecount,
        lastmake_at: new Date().toISOString()
      }).eq('id', user.id)

      return { success: true, message: '만들기 진행' }

    } else {
      // 비로그인 유저
      const anonId = await getAnonymousId()
      const { data, error } = await supabase
        .from('temp_info')
        .select('lastmake_at, makecount')
        .eq('id', anonId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error(error)
        return { success: false, message: '조회 실패' }
      }

      let makecount = data?.makecount || 0
      const lastDate = data?.lastmake_at ? data.lastmake_at.split('T')[0] : null

      if (lastDate === today) {
        if (makecount < 1) {
          makecount += 1
        } else {
          return { success: false, message: '오늘 횟수 초과 (비회원)' }
        }
      } else {
        makecount = 1
      }

      await supabase.from('temp_info').upsert({
        id: anonId,
        makecount,
        lastmake_at: new Date().toISOString()
      })

      return { success: true, message: '만들기 진행' }
    }
  }

  const getAnonymousId = async () => {
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
      return
    }
    console.log('✅ 유저임시등록 완료!')
    }
    return anonId
  }
  const handleupload = async (upload_file:File|null,bucket:string) => {
    if(!upload_file){
      return ''
    }
    // 파일 이름 생성
    const fileExt = upload_file.name.split('.').pop()
    const fileName = `${userinfo.user_id}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // 1. Storage에 업로드
    const { error: storageError } = await supabase.storage
      .from(bucket+'_img')
      .upload(filePath, upload_file, {
      cacheControl: '3600',
      upsert: false,
      contentType: upload_file.type, 
    })

    if (storageError) {
      setMessage(`❌ 이미지 저장 실패: ${storageError.message}`)
      return
    }

    // 2. Public URL 생성
    const { data: publicUrlData } = supabase.storage
      .from(bucket+'_img')
      .getPublicUrl(filePath)
    const imageUrl = publicUrlData.publicUrl
    if(bucket==='result'){
      setResultImage(imageUrl)
    }
    return imageUrl
  
  }
  const handleGenerate = async () => {
    if (!imageFile || !prompt) {
      setMessage('❌ 이미지와 프롬프트를 모두 입력해주세요.')
      return
    }

    const resultUrl = imageFile // 테스트용 결과 이미지
    
    // 로그인 여부 확인
    if (userinfo) {
      // 로그인된 사용자 → image_process 테이블에 저장
      const count_check= await handleMake(userinfo, true)
      if(!count_check.success){
        setMessage(`❌ ${count_check.message}`)
        return
      }else{
        setMessage(`✅ ${count_check.message}`)
      }
      const { error } = await supabase.from('image_process').insert([
        {
          user_id: userinfo.id,
          upload_img: await handleupload(imageFile,'upload'),
          prompt_text: prompt,
          complete_img: await handleupload(resultUrl,'result'),
          created_at: new Date().toISOString(),
        },
      ])
      if (error) {
        setMessage(`❌ 저장 실패: ${error.message}`)
        return
      }
      setMessage('✅ 이미지 생성 및 저장 완료!')
    } else {
      const count_check= await handleMake(userinfo, false)
      if(!count_check.success){
        setMessage(`❌ ${count_check.message}`)
        return
      }else{
        setMessage(`✅ ${count_check.message}`)
      }
      // 비로그인 사용자 → notlogin_image_process 테이블에 저장
      const anonId = await getAnonymousId()
      const { error } = await supabase.from('notlogin_image_process').insert([
        {
          user_id: anonId,
          upload_img: await handleupload(imageFile,'upload'),
          prompt_text: prompt,
          complete_img: await handleupload(resultUrl,'result'),
          created_at: new Date().toISOString(),
        },
      ])
      if (error) {
        setMessage(`❌ 저장 실패: ${error.message}`)
        return
      }
      setMessage('✅ 이미지 생성 완료 (비회원 저장됨)')
    }
    
    
  }

  const handleUpload = async () => {
    if (!userinfo) {
    alert('로그인 후 이용해주세요')
    return
  }

  if (!resultImage) {
    setMessage('❌ 결과 이미지가 없습니다.')
    return
  }

  if (!userinfo?.id) {
    setMessage('❌ 사용자 정보가 없습니다.')
    return
  }

  // image_posts 테이블에 저장
  const { error } = await supabase.from('image_posts').insert([
    {
      body: resultImage,             // 결과 이미지 URL
      user_id: userinfo.id,     // 로그인된 사용자 ID
      board_id: contestId,           // 연결된 contest ID가 있다면 여기에 넣기
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    setMessage(`❌ 이미지 업로드 실패: ${error.message}`)
    return
  }

  setMessage('✅ 이미지 게시 완료!')
  router.push('/') // 메인 페이지로 이동

  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>🎨 이미지 생성 테스트</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label>
          원본 이미지 업로드
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        <label>
          프롬프트 입력
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </label>

        <button onClick={handleGenerate} style={{
          padding: '10px',
          backgroundColor: '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          만들기
        </button>

        {resultImage && (
          <div style={{ marginTop: 20 }}>
            <h4>🖼️ 결과 이미지</h4>
            <img src={resultImage} alt="결과 이미지" style={{ width: '100%', borderRadius: '8px' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <a href={resultImage} download="result.jpg">
                <button>📥 다운로드</button>
              </a>
              <button onClick={handleUpload}>📤 업로드</button>
            </div>
          </div>
        )}
        <p>{message}</p>
      </div>
    </div>
  )
}