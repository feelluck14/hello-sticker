'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { useI18n } from '@/components/I18nContext'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortType, setSortType] = useState<'latest' | 'likes'>('likes')
  const searchParams = useSearchParams()
  const contestId = searchParams.get('board_id')
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!contestId) {
          setError('콘테스트 ID가 없습니다.')
          return
        }

        // Set timeout for the operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('요청 시간이 초과되었습니다')), 10000)
        })

        const fetchPromise = async () => {
          const { data, error } = await supabase
            .from('image_posts')
            .select(`
              *,
              users_info!inner(nickname)
            `)
            .eq('board_id', contestId)

          if (error) {
            throw new Error('데이터를 불러오는데 실패했습니다: ' + error.message)
          }

          if (!data || data.length === 0) {
            setPosts([])
            return
          }

          // Fetch likes for all posts at once
          const postIds = data.map(post => post.id)
          const { data: likesData, error: likesError } = await supabase
            .from('post_likes')
            .select('post_id')
            .in('post_id', postIds)

          if (likesError) {
            console.warn('좋아요 데이터를 불러오는데 실패했습니다:', likesError.message)
          }

          // Count likes per post
          const likesCount = (likesData ?? []).reduce((acc, like) => {
            acc[like.post_id] = (acc[like.post_id] || 0) + 1
            return acc
          }, {} as Record<number, number>)

          // Add likes count to posts
          const postsWithLikes = data.map(post => ({
            ...post,
            likes: likesCount[post.id] || 0
          }))

          setPosts(postsWithLikes)
        }

        await Promise.race([fetchPromise(), timeoutPromise])
      } catch (err) {
        console.error('데이터를 불러오는데 오류가 발생했습니다:', err)
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [contestId])

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortType === 'latest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      return b.likes - a.likes
    }
  })

  if (loading) {
    return (
      <div className="max-w-screen-md mx-auto px-6 py-8 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-screen-md mx-auto px-6 py-8 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">오류가 발생했습니다: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-md mx-auto px-6 py-8">
      <h1 className="text-center text-2xl font-bold mb-6">{t('imageBoard.title')}</h1>

      {/* ✅ 드롭다운 메뉴 */}
      <div className="flex justify-end mb-6">
        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value as 'likes' | 'latest')}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="likes">{t('imageBoard.sortByLikes')}</option>
          <option value="latest">{t('imageBoard.sortByLatest')}</option>
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
              alt={t('imageBoard.postImageAlt')}
              className="w-24 h-24 object-cover rounded"
            />
            {/* 정보 (가로 배치) */}
            <div className="flex flex-col gap-1 text-sm">
              <div>{t('imageBoard.author')} {post.users_info?.nickname}</div>
              <div>{t('imageBoard.likes')} {post.likes}</div>
              <div className="text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}