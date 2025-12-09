 'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import ImageUploadModal from '@/components/ImageUploadModal'
import ResultModal from '@/components/ResultModal'
import { getAnonymousId, handleupload } from '@/lib/imageHelpers'

export default function ImageCreatePage() {
  const { userinfo, loading } = useAuth()
  const [prompt, setPrompt] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [contestData, setContestData] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false) // 만들기 모달 상태
  const [uploadModalOpen, setUploadModalOpen] = useState(false) // 업로드이미지 모달 상태
  const [message, setMessage] = useState('')
  const [uploadimages, setUploadImages] = useState<any[]>([])
  const [upimgpage, setupimgPage] = useState(0)
  const [upimgloading, setUpimgLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const contestId = searchParams.get('board_id')
 useEffect(() => {
    const fetchContest = async () => {
      if (!contestId) return
      const { data, error } = await supabase
        .from('contest_posts') 
        .select('*')
        .eq('id', contestId)
        .single()

      if (error) {
        console.error('❌ 데이터 조회 실패:', error.message)
      } else {
        setContestData(data)
      }
    }
    fetchContest()
  }, [contestId])
  // URL을 File 객체로 변환하는 함수
  async function urlToFile(url: string, filename?: string): Promise<File> {
    const response = await fetch(url)
    const blob = await response.blob()

    // 파일 이름이 없으면 URL에서 추출
    const name = filename || url.split('/').pop() || 'download.png'

    // Blob을 File로 변환
    return new File([blob], name, { type: blob.type })
  }


 const handleImguploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click() // 숨겨진 input 열기
    }
  }
  const handleImageSelect = async (url: string) => {
    const file = await urlToFile(url)
    console.log(file)
    setImageFile(file)
    setImagePreview(url)
    setUploadModalOpen(false) // 모달 닫기
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setResultImage(null)
      setUploadModalOpen(false)
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

  // use imported getAnonymousId from lib/imageHelpers
  // page 레벨에 숨겨진 input을 항상 렌더링하도록 변경
  const fetchImages = async (pageNum: number) => {
    setUpimgLoading(true)
    const { data, error } = await supabase.storage
      .from('upload_img')
      .list('', { limit: 100, offset: pageNum * 10 })

    if (error) {
      console.error('❌ 이미지 불러오기 실패:', error.message)
    } else {
      setUploadImages(data || [])
    }
    setUpimgLoading(false)
  }

  const openModal = () => {
    setUploadModalOpen(true)
    fetchImages(0) // 첫 페이지 불러오기
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
      // 먼저 파일을 각각 업로드하고 반환된 URL을 상태에 반영
      const uploadedUrl = await handleupload(imageFile, 'upload', userinfo)
      const completedUrl = await handleupload(resultUrl, 'result', userinfo)
      // 결과 이미지 상태 업데이트 및 모달 오픈
      if (completedUrl) {
        setResultImage(completedUrl)
        setIsModalOpen(true)
      }

      const { error } = await supabase.from('image_process').insert([
        {
          user_id: userinfo.id,
          upload_img: uploadedUrl,
          prompt_text: prompt,
          complete_img: completedUrl,
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
      // 업로드 후 결과 모달 표시
      const uploadedUrl = await handleupload(imageFile, 'upload', userinfo)
      const completedUrl = await handleupload(resultUrl, 'result', userinfo)
      if (completedUrl) {
        setResultImage(completedUrl)
        setIsModalOpen(true)
      }

      const { error } = await supabase.from('notlogin_image_process').insert([
        {
          user_id: anonId,
          upload_img: uploadedUrl,
          prompt_text: prompt,
          complete_img: completedUrl,
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
  if (!contestData) {
    return <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-opacity-50"></div>
  }

  return (
    <div style={{ maxWidth: 600, margin: '10px auto', padding: '20px' }}>
      <div style={{ maxWidth: 600, padding: '15px',border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '16px', color: '#333' }}>{contestData.title}</h2>
        {contestData.image && (
          <img
            src={contestData.image}
            alt="게시글 이미지"
            style={{ width: '60%', borderRadius: '8px', marginBottom: '16px' }}
          />
        )}
        <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6', color: '#555' }}>
          {contestData.body}
        </p>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
          작성일: {new Date(contestData.created_at).toLocaleString()}
        </p>
      </div>


      <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center',marginTop: '20px' }}>
        {/* 캐릭터 선택 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ marginBottom: '8px' }}>캐릭터</label>
          <button onClick={openModal} style={{ padding: 0, border: 'none', background: 'none' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#eee',
                borderRadius: '12px',
                cursor: 'pointer',
                width: '120px',
                height: '120px',
                overflow: 'hidden',
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="선택된 캐릭터"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '32px', color: '#666' }}>＋</span>
              )}
            </div>
          </button>
            <ImageUploadModal
              open={uploadModalOpen}
              onClose={() => setUploadModalOpen(false)}
              uploadimages={uploadimages}
              loading={loading}
              upimgpage={upimgpage}
              setupimgPage={setupimgPage}
              handleImageSelect={handleImageSelect}
              handleImguploadClick={handleImguploadClick}
              fileInputRef={fileInputRef}
              handleImageChange={handleImageChange}
              getUrl={(name: string) => supabase.storage.from('upload_img').getPublicUrl(name).data.publicUrl}
            />
        </div>
        {/* 프롬프트 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <label style={{ marginBottom: '8px' }}>프롬프트 입력</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              width: '100%',
              height: '120px',
              resize: 'none', // 크기 조절 비활성화 (원하면 제거 가능)
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          />
        </div>

        {/* 만들기 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={handleGenerate}
            style={{
              marginTop: '24px',
              padding: '10px 16px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            만들기
          </button>
        </div>
      </div>

      {isModalOpen && resultImage && (
        <ResultModal resultImage={resultImage} onClose={() => setIsModalOpen(false)} onUpload={handleUpload} />
      )}

        <p>{message}</p>
        {/* 항상 존재하는 숨겨진 파일 입력 (모달과 별개로 페이지에서 사용) */}
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
    </div>
  )
}