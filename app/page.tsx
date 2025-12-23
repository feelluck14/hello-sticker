'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: contests, error } = await supabase.from('contest_posts').select('*')
      if (error) {
        console.error(error)
        return
      }

      const enriched = await Promise.all(
        (contests ?? []).map(async (contest) => {
          const { data: images } = await supabase
            .from('image_posts')
            .select('*')
            .eq('board_id', contest.id)

          // 각 이미지의 좋아요 수 가져오기
          const imagesWithLikes = await Promise.all(
            (images ?? []).map(async (img) => {
              const { count } = await supabase
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', img.id)
              
              return {
                ...img,
                likes: count ?? 0
              }
            })
          )
          if(imagesWithLikes!=null){
            const sortedPosts = [...imagesWithLikes].sort((a, b) => {
              return b.likes - a.likes
            })
            return {
            ...contest,
            images: sortedPosts,
          }
          }

          return {
            ...contest,
            images: imagesWithLikes,
          }
        })
      )
      setContestList(enriched)
    }

    fetchData()
  }, [])

  const handleCreateContest = () => {
    router.push('/contest-create')
  }

  const handleCreateImage = (contestId: number) => {
    router.push(`/image-create?board_id=${contestId}`)
  }

  const handleImageBoard = (contestId: number) => {
    router.push(`/image-board?board_id=${contestId}`)
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
                만들기
              </button>
              <button
                onClick={() =>handleImageBoard(contest.id)} 
                className="bg-gray-200 px-3 py-1 rounded">갤러리</button>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{contest.description}</p>

          {/* 이미지 리스트 */}
          <HorizontalScroll>
            {contest.images.map((img) => (
              <div key={img.id} className="relative flex-shrink-0">
                <img
                  src={img.body}
                  alt="이모티콘"
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