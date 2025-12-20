'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'

type UserPost = {
  id: number
  body: string
  created_at: string
  likes?: number
}

type LikedPost = {
  id: number
  body: string
  created_at: string
  likes?: number
}

export default function MyPage() {
  const { userinfo, loading } = useAuth()
  const router = useRouter()
  const [userPosts, setUserPosts] = useState<UserPost[]>([])
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts')

  useEffect(() => {
    if (!loading && !userinfo) {
      alert('로그인이 필요합니다.');
      router.push('/auth')
      return
    }

    if (userinfo) {
      fetchUserPosts()
      fetchLikedPosts()
    }
  }, [userinfo, loading])

  const fetchUserPosts = async () => {
    if (!userinfo) return

    // 사용자가 작성한 게시물 가져오기
    const { data: posts } = await supabase
      .from('image_posts')
      .select('*')
      .eq('user_id', userinfo.id)
      .order('created_at', { ascending: false })

    // 각 게시물의 좋아요 수 가져오기
    const postsWithLikes = await Promise.all(
      (posts ?? []).map(async (post) => {
        const { count } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        return {
          ...post,
          likes: count ?? 0
        }
      })
    )

    setUserPosts(postsWithLikes)
  }

  const fetchLikedPosts = async () => {
    if (!userinfo) return

    // 사용자가 좋아요한 게시물 가져오기
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userinfo.id)

    if (!likes || likes.length === 0) {
      setLikedPosts([])
      return
    }

    const postIds = likes.map(like => like.post_id)

    const { data: posts } = await supabase
      .from('image_posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false })

    // 각 게시물의 좋아요 수 가져오기
    const postsWithLikes = await Promise.all(
      (posts ?? []).map(async (post) => {
        const { count } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        return {
          ...post,
          likes: count ?? 0
        }
      })
    )

    setLikedPosts(postsWithLikes)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  if (!userinfo) {
    return null
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {/* 프로필 섹션 */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold mb-4">마이페이지</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">프로필 정보</h2>
          <div className="space-y-2">
            <p><strong>이름:</strong> {userinfo.username}</p>
            <p><strong>이메일:</strong> {userinfo.email}</p>
            <p><strong>닉네임:</strong> {userinfo.nickname}</p>
            {userinfo.phone && <p><strong>휴대폰:</strong> {userinfo.phone}</p>}
            {userinfo.birth && <p><strong>생년월일:</strong> {userinfo.birth}</p>}
          </div>
        </div>
      </section>

      {/* 탭 메뉴 */}
      <section className="mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'posts'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            내가 만든 작품 ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'likes'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            좋아요한 작품 ({likedPosts.length})
          </button>
        </div>
      </section>

      {/* 작품 목록 */}
      <section>
        {activeTab === 'posts' ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">내가 만든 작품</h2>
            {userPosts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 만든 작품이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative cursor-pointer hover:opacity-80 transition"
                    onClick={() => router.push(`/image-detail/${post.id}`)}
                  >
                    <img
                      src={post.body}
                      alt="작품"
                      className="w-full aspect-square object-cover rounded-lg shadow"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <span>❤️</span>
                      <span>{post.likes}</span>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-60 px-2 py-1 rounded">
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">좋아요한 작품</h2>
            {likedPosts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 좋아요한 작품이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {likedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative cursor-pointer hover:opacity-80 transition"
                    onClick={() => router.push(`/image-detail/${post.id}`)}
                  >
                    <img
                      src={post.body}
                      alt="좋아요한 작품"
                      className="w-full aspect-square object-cover rounded-lg shadow"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <span>❤️</span>
                      <span>{post.likes}</span>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-60 px-2 py-1 rounded">
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}