'use client'

import { useState, useEffect,useRef  } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter,useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'

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

 const handleImguploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click() // 숨겨진 input 열기
    }
  }
  const handleImageSelect = (url: string) => {
    setImagePreview(url)
    setUploadModalOpen(false) // 모달 닫기
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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
      setIsModalOpen(true) // 결과 나오면 모달 열기
    }
    return imageUrl
  
  }
  const fetchImages = async (pageNum: number) => {
    setUpimgLoading(true)
    const { data, error } = await supabase.storage
      .from('upload_img')
      .list('', { limit: 10, offset: pageNum * 10 })

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
              onClick={handleImguploadClick}
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
            {uploadModalOpen && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100vw',
                      height: '100vh',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1000,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        maxWidth: '600px',
                        width: '90%',
                      }}
                    >
                      <h3>📋 업로드 이미지 목록</h3>

                      {loading ? (
                        <header className="w-full flex justify-center p-4 border-b">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-opacity-50"></div>
                        </header>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px',
                            padding: '20px',
                          }}
                        >
                          {uploadimages
                            .slice(upimgpage * 8, upimgpage * 8 + 8) // ✅ 한 페이지에 6개만 표시
                            .map((img) => {
                              const url = supabase.storage.from('upload_img').getPublicUrl(img.name).data.publicUrl
                              return (
                                <button
                                key={img.name}
                                onClick={() => handleImageSelect(url)} // ✅ 이미지 클릭 시 함수 실행
                                style={{
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                  backgroundColor: '#f9f9f9',
                                  height: '120px',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                              >
                                <img
                                  src={supabase.storage.from('upload_img').getPublicUrl(img.name).data.publicUrl}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </button>
                              )
                            })}

                          {/* 가운데 + 버튼 */}
                          <div
                            onClick={handleImguploadClick}
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: '#eee',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              height: '120px',
                            }}
                          >
                            <span style={{ fontSize: '32px', color: '#666' }}>＋</span>
                          </div>
                            {/* 숨겨진 파일 입력 */}
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              style={{ display: 'none' }}
                              onChange={handleImageChange}
                            />
                        </div>
                      )}

                      {/* 페이지네이션 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <button disabled={upimgpage === 0} onClick={() => setupimgPage(upimgpage - 1)}>
                          ◀ 이전
                        </button>
                        <span>{upimgpage + 1} 페이지</span>
                        <button
                          disabled={(upimgpage + 1) * 6 >= uploadimages.length}
                          onClick={() => setupimgPage(upimgpage + 1)}
                        >
                          다음 ▶
                        </button>
                      </div>

                      <button onClick={() => setUploadModalOpen(false)} style={{ marginTop: '10px' }}>
                        ❌ 닫기
                      </button>
                    </div>
                  </div>
            )}
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

      {/* ✅ 모달 */}
      {isModalOpen && resultImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              textAlign: 'center',
            }}
          >
            <h4>🖼️ 결과 이미지</h4>
            <img
              src={resultImage}
              alt="결과 이미지"
              style={{ width: '50%', borderRadius: '8px' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'center' }}>
              <a href={resultImage} download="result.jpg">
                <button>📥 다운로드</button>
              </a>
              <button onClick={handleUpload}>📤 업로드</button>
              <button onClick={() => setIsModalOpen(false)}>❌ 닫기</button>
            </div>
          </div>
        </div>
          )}

        <p>{message}</p>
    </div>
  )
}