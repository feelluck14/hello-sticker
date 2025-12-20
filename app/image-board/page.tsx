'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
type Post = {
  id: number
  body: string       // 이미지 URL
  user_id: number
  status: string
  created_at: string
  likes: number
  users_info?: {
    nickname: string
  }
}

export default function ImageBoardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [sortType, setSortType] = useState<'latest' | 'likes'>('likes')
  const searchParams = useSearchParams()
  const contestId = searchParams.get('board_id')
  const router = useRouter()

  useEffect(() => {
    const fetchPosts = async () => {
      if (!contestId) return
      const { data, error } = await supabase
        .from('image_posts') 
        .select(`
        *,
        users_info!inner(nickname)
        `)
        .eq('board_id', contestId)
      if (error) {
        console.error('❌ 데이터 조회 실패:', error.message)
      } else {
        setPosts(data)
      }
      if(!data) return
      const likesPromises = data.map(async (post) => {
        const { count } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
        
          return { ...post, likes: count ?? 0 }
      })
      setPosts(await Promise.all(likesPromises))

    }
    fetchPosts()
  }, [])

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortType === 'latest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      return b.likes - a.likes
    }
  })

  return (
    <div className="max-w-screen-md mx-auto px-6 py-8">
      <h1 className="text-center text-2xl font-bold mb-6">📸 이미지 게시판</h1>

      {/* ✅ 드롭다운 메뉴 */}
      <div className="flex justify-end mb-6">
        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value as 'likes' | 'latest')}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="likes">좋아요순</option>
          <option value="latest">최신순</option>
        </select>
      </div>

      {/* ✅ 게시글 리스트 (세로 스크롤) */}
      <div className="flex flex-col gap-4">
        {sortedPosts.map((post) => (
          <button
            key={post.id}
            onClick={() => router.push(`/image-detail/${post.id}`)}
            className="flex items-center gap-4 border border-gray-200 rounded-lg bg-white shadow p-3"
          >
            {/* 이미지 */}
            <img
              src={post.body}
              alt="게시글 이미지"
              className="w-24 h-24 object-cover rounded"
            />
            {/* 정보 (가로 배치) */}
            <div className="flex flex-col gap-1 text-sm">
              <div>작성자: {post.users_info?.nickname}</div>
              <div>❤️ 좋아요: {post.likes}</div>
              <div className="text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}