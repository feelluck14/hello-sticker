'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/components/I18nContext'

type Contest = {
  id: number
  title: string
  description: string
}

type ImagePost = {
  id: number
  body: string
  board_id: number
  likes?: number
}

export default function MainPage() {
  const [contestList, setContestList] = useState<(Contest & { images: ImagePost[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()
  const { t } = useI18n()

  const fetchData = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetryCount(prev => prev + 1)
      }
      setLoading(true)
      setError(null)

      // Set a timeout for the entire operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('요청 시간이 초과되었습니다')), 15000)
      })

      const fetchPromise = async () => {
        const { data: contests, error } = await supabase.from('contest_posts').select('*')
        if (error) {
          throw new Error('콘테스트 데이터를 불러오는데 실패했습니다: ' + error.message)
        }

        if (!contests || contests.length === 0) {
          setContestList([])
          return
        }

        // Optimize: Fetch all images for all contests in one query
        const contestIds = contests.map(c => c.id)
        const { data: allImages, error: imagesError } = await supabase
          .from('image_posts')
          .select('*')
          .in('board_id', contestIds)

        if (imagesError) {
          throw new Error('이미지 데이터를 불러오는데 실패했습니다: ' + imagesError.message)
        }

        // Group images by contest_id
        const imagesByContest = (allImages ?? []).reduce((acc, img) => {
          if (!acc[img.board_id]) acc[img.board_id] = []
          acc[img.board_id].push(img)
          return acc
        }, {} as Record<number, ImagePost[]>)

        // Fetch likes for all images at once
        const imageIds = (allImages ?? []).map(img => img.id)
        const { data: allLikes, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')

        if (likesError) {
          console.warn('좋아요 데이터를 불러오는데 실패했습니다:', likesError.message)
        }

        // Count likes per image
        const likesCount = (allLikes ?? []).reduce((acc, like) => {
          acc[like.post_id] = (acc[like.post_id] || 0) + 1
          return acc
        }, {} as Record<number, number>)

        const enriched = contests.map(contest => {
          const contestImages = imagesByContest[contest.id] || []
          const imagesWithLikes = contestImages.map((img: ImagePost) => ({
            ...img,
            likes: likesCount[img.id] || 0
          })).sort((a: ImagePost & { likes: number }, b: ImagePost & { likes: number }) => b.likes - a.likes)

          return {
            ...contest,
            images: imagesWithLikes
          }
        })

        setContestList(enriched)
      }

      await Promise.race([fetchPromise(), timeoutPromise])
    } catch (err) {
      console.error('데이터를 불러오는데 오류가 발생했습니다:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRetry = () => {
    fetchData(true)
  }

  const handleCreateContest = () => {
    router.push('/contest-create')
  }

  const handleCreateImage = (contestId: number) => {
    router.push(`/image-create?board_id=${contestId}`)
  }

  const handleImageBoard = (contestId: number) => {
    router.push(`/image-board?board_id=${contestId}`)
  }

  if (loading) {
    return (
      <main className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">오류가 발생했습니다: {error}</p>
          <div className="space-x-2">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도 {retryCount > 0 && `(${retryCount})`}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              새로고침
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      {/* 상단 만들기 버튼 */}
        <button
          onClick={handleCreateContest}
          className="ml-auto bg-gray-300 text-gray-700 w-8 h-8 mb-4 flex items-center justify-center rounded hover:bg-gray-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>


      {/* contest 행 + 이미지 열 */}
      {contestList.map((contest) => (
        <section key={contest.id} className="mb-10">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">{contest.title}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleCreateImage(contest.id)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                {t('main.create')}
              </button>
              <button
                onClick={() =>handleImageBoard(contest.id)} 
                className="bg-gray-200 px-3 py-1 rounded">{t('main.gallery')}</button>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{contest.description}</p>

          {/* 이미지 리스트 */}
          <HorizontalScroll>
            {contest.images.map((img) => (
              <div key={img.id} className="relative flex-shrink-0">
                <img
                  src={img.body}
                  alt={t('main.emojiAlt')}
                  className="w-20 aspect-square object-cover rounded shadow cursor-pointer hover:opacity-80"
                  onClick={() => router.push(`/image-detail/${img.id}`)}
                />
                {/* 좋아요 수 표시 */}
                <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded flex items-center gap-1">
                  <span>❤️</span>
                  <span>{img.likes}</span>
                </div>
              </div>
            ))}
          </HorizontalScroll>
        </section>
      ))}
    </main>
  )
}

/* ✅ 가로 스크롤 컴포넌트 */
function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      // 세로 휠을 가로 스크롤로 변환
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div
      ref={ref}
      className="flex gap-4 overflow-x-scroll overflow-y-hidden no-scrollbar"
    >
      {children}
    </div>
  )
}