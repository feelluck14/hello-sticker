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
  const { userinfo, loading, login } = useAuth()
  const router = useRouter()
  const [userPosts, setUserPosts] = useState<UserPost[]>([])
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    nickname: '',
    phone: '',
    birth: ''
  })
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading && !userinfo) {
      alert('로그인이 필요합니다.');
      router.push('/auth')
      return
    }

    if (userinfo) {
      fetchUserPosts()
      fetchLikedPosts()
      setEditForm({
        username: userinfo.username || '',
        nickname: userinfo.nickname || '',
        phone: userinfo.phone || '',
        birth: userinfo.birth || ''
      })
      setNicknameChecked(false)
      setNicknameAvailable(null)
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

  const checkNicknameAvailability = async () => {
    if (!userinfo || editForm.nickname === userinfo.nickname) {
      setNicknameChecked(true)
      setNicknameAvailable(true)
      return
    }

    if (editForm.nickname.trim() === '') {
      alert('닉네임을 입력해주세요.')
      return
    }

    const { data, error } = await supabase
      .from('users_info')
      .select('nickname')
      .eq('nickname', editForm.nickname)
      .neq('user_id', userinfo.user_id)

    if (error) {
      alert('닉네임 체크 실패: ' + error.message)
      return
    }

    const isAvailable = data.length === 0
    setNicknameAvailable(isAvailable)
    setNicknameChecked(true)

    if (!isAvailable) {
      alert('이미 사용중인 닉네임입니다.')
    }
  }

  const handleSaveProfile = async () => {
    if (!userinfo) return

    // 필수 필드 검증
    if (editForm.username.trim() === '' || editForm.nickname.trim() === '') {
      alert('이름과 닉네임을 입력해주세요.')
      return
    }

    // 닉네임 변경 시 중복 체크 확인
    if (editForm.nickname !== userinfo.nickname && (!nicknameChecked || !nicknameAvailable)) {
      alert('닉네임 중복 체크를 해주세요.')
      return
    }

    const { error } = await supabase
      .from('users_info')
      .update({
        username: editForm.username,
        nickname: editForm.nickname,
        phone: editForm.phone.trim() === '' ? null : editForm.phone,
        birth: editForm.birth.trim() === '' ? null : editForm.birth
      })
      .eq('user_id', userinfo.user_id)

    if (error) {
      alert('프로필 업데이트 실패: ' + error.message)
    } else {
      await login!() // userinfo 새로고침
      alert('프로필이 업데이트되었습니다.')
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      username: userinfo.username || '',
      nickname: userinfo.nickname || '',
      phone: userinfo.phone || '',
      birth: userinfo.birth || ''
    })
    setIsEditing(false)
    setNicknameChecked(false)
    setNicknameAvailable(null)
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">마이페이지</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              수정
            </button>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">프로필 정보</h2>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이름</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">닉네임</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => {
                      setEditForm({ ...editForm, nickname: e.target.value })
                      if (e.target.value !== userinfo.nickname) {
                        setNicknameChecked(false)
                        setNicknameAvailable(null)
                      }
                    }}
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    onClick={checkNicknameAvailability}
                    disabled={editForm.nickname === userinfo.nickname || editForm.nickname.trim() === ''}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    중복체크
                  </button>
                </div>
                {nicknameChecked && (
                  <p className={`text-sm mt-1 ${nicknameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {nicknameAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용중인 닉네임입니다.'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">휴대폰</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">생년월일</label>
                <input
                  type="date"
                  value={editForm.birth}
                  onChange={(e) => setEditForm({ ...editForm, birth: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={
                    editForm.username.trim() === '' ||
                    editForm.nickname.trim() === '' ||
                    (editForm.nickname !== userinfo.nickname && (!nicknameChecked || !nicknameAvailable))
                  }
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  저장
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p><strong>이름:</strong> {userinfo.username}</p>
              <p><strong>이메일:</strong> {userinfo.email}</p>
              <p><strong>닉네임:</strong> {userinfo.nickname}</p>
              {userinfo.phone && <p><strong>휴대폰:</strong> {userinfo.phone}</p>}
              {userinfo.birth && <p><strong>생년월일:</strong> {userinfo.birth}</p>}
            </div>
          )}
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