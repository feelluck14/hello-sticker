'use client'

import { useEffect, useState } from 'react'
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

      // contests가 null일 경우 빈 배열로 처리
      const enriched = await Promise.all(
        (contests ?? []).map(async (contest) => {
          const { data: images } = await supabase
            .from('image_posts')
            .select('*')
            .eq('board_id', contest.id)

          return {
            ...contest,
            images: images ?? [],
          }
        })
      )
      console.log('Enriched Contests:', enriched)
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
  
  return (
    <main className="p-6">
      {/* 상단 만들기 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleCreateContest}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          만들기
        </button>
      </div>

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
              <button className="bg-gray-200 px-3 py-1 rounded">갤러리</button>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{contest.description}</p>

          <div className="flex gap-4 overflow-x-auto">
            {contest.images.map((img) => {
              console.log('Image:', img.body)
              return (
                <img
                  key={img.id}
                  src={img.body}
                  alt="이모티콘"
                  className="w-32 aspect-square object-cover rounded shadow cursor-pointer hover:opacity-80"
                  onClick={() => router.push(`/image-detail/${img.id}`)} // ✅ 클릭 시 상세 페이지 이동
                />
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}