'use client'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { cache, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams,useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { useI18n } from '@/components/I18nContext'
import { isMobile, generateWhatsAppShareUrl } from '@/lib/imageHelpers'
import QRCode from 'qrcode'

type ImagePost = {
  id: number
  body: string
  user_id: number
  created_at: string
  users_info?: {
    nickname: string
  }
}

type Reply = {
  id: number
  body: string
  user_id: number
  post_id: number
  parent_id: number | null
  created_at: string
  users_info?: {
    nickname: string
  }
}

export default function ImageDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { userinfo, loading } = useAuth()
  const [likes, setLikes] = useState<number>(0)
  const [liked, setLiked] = useState(false)
  const [image, setImage] = useState<ImagePost | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [replyTarget, setReplyTarget] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const { t } = useI18n()
  // 댓글 데이터 가져오는 함수
  const fetchReplies = async () => {
    const { data: replyData } = await supabase
      .from('posts_reply')
      .select(`
        *,
        users_info!inner(nickname)
      `)
      .eq('post_id', id)
    setReplies(replyData ?? [])
  }

  useEffect(() => {
    
    const fetchData = async () => {
      if (loading) return
      const { data: imageData } = await supabase
        .from('image_posts')
        .select(`
          *,
          users_info!inner(nickname)`
        )
        .eq('id', id)
        .single()
      setImage(imageData)

      const { data: replyData } = await supabase
        .from('posts_reply')
        .select(`
          *,
          users_info!inner(nickname)
        `)
        .eq('post_id', id)

      setReplies(replyData ?? [])
      
      if(userinfo){
        try {
          const { data } = await supabase
            .from('post_likes')
            .select('*')
            .eq('post_id', id)
            .eq('user_id', userinfo.id)
            .maybeSingle()
          if(data==null){
            setLiked(false)
          }else{
            setLiked(!!data)
          }
        }catch (error) {
          console.error('좋아요 여부 조회 실패:', error)
        }
      }
      try {
          const { count, error } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', id)
          setLikes(count ?? 0)
      } catch (error) {
        console.error('좋아요 수 조회 실패:', error)
      }
      
      

      
    }
    fetchData()
  }, [id, userinfo, loading])

  const handleExportToWhatsApp = async (imageUrl: string) => {
    try {
      const shareUrl = generateWhatsAppShareUrl(imageUrl);

      if (isMobile()) {
        // 모바일: WhatsApp으로 직접 공유
        window.location.href = `whatsapp://send?text=${encodeURIComponent(`Check out this image: ${imageUrl}`)}`;
      } else {
        // 데스크톱: QR 코드 생성 및 모달 표시
        const qrCodeDataUrl = await QRCode.toDataURL(shareUrl);
        setQrCodeUrl(qrCodeDataUrl);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('내보내기에 실패했습니다.');
    }
  };

  // 좋아요 토글
  const toggleLike = async () => {
    if (!userinfo) {
      alert('로그인이 필요합니다.');
      return
    }
  if (liked) {
      // 좋아요 취소
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', userinfo.id)
      setLiked(false)
      setLikes((prev) => prev - 1)
    } else {
      // 좋아요 등록
      await supabase
        .from('post_likes')
        .insert({ user_id: userinfo.id, post_id: id })
      setLiked(true)
      setLikes((prev) => prev + 1)
    }
  }
  // 댓글 작성
  const handleAddComment = async () => {
    if(!userinfo){
      alert('로그인이 필요합니다.');
      return
    }
    const userId = userinfo.id// 실제 로그인 유저 ID 가져오기
    if (!newComment.trim()) return
    await supabase.from('posts_reply').insert({
      body: newComment,
      user_id: userId,
      post_id: Number(id),
      parent_id: null,
    })
    setNewComment('')
    await fetchReplies()
  }

  // 답글 작성
  const handleAddReply = async () => {
    if(!userinfo){
      alert('로그인이 필요합니다.');
      return
    }
    const userId = userinfo.id // 실제 로그인 유저 ID 가져오기
    if (!replyText.trim() || replyTarget === null) return
    await supabase.from('posts_reply').insert({
      body: replyText,
      user_id: userId,
      post_id: Number(id),
      parent_id: replyTarget,
    })
    setReplyText('')
    setReplyTarget(null)
    await fetchReplies()
  }

  // 댓글 삭제
  const handleDeleteReply = async (replyId: number) => {
    await supabase.from('posts_reply').delete().eq('id', replyId)
    await fetchReplies()
  }


  const renderReplies = (parentId: number | null = null, depth: number = 0) => {
    return replies
      .filter((r) => r.parent_id === parentId)
      .map((r) => (
        <div
          key={r.id}
          className={`ml-${depth * 4} mt-3 p-3 border rounded bg-gray-50`}
        >
          {/* 댓글 본문 */}
          <p className="text-sm text-gray-800 mb-1">{r.body}</p>

          {/* 작성자 + 작성일 */}
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <span>작성자: {r.users_info?.nickname || '알 수 없음'}</span>
            <span className="ml-2">
              {new Date(r.created_at).toLocaleString()}
            </span>
            {userinfo?.id === r.user_id && (
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-200 transition"
                onClick={() => handleDeleteReply(r.id)}
              >
                🗑
              </button>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-3 text-xs">
            {depth === 0 && (
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                onClick={() =>
                  setReplyTarget(replyTarget === r.id ? null : r.id)
                }
              >
                {replyTarget === r.id ? t('imageDetail.close') : t('imageDetail.reply')}
              </button>
            )}

              {/* 답글 입력창: 해당 댓글 바로 아래 */}
              {replyTarget === r.id && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t('imageDetail.replyPlaceholder')}
                    className="flex-1 border rounded px-2 py-1"
                  />
                  <button
                    onClick={async () => {
                      await handleAddReply()
                      setReplyTarget(null) // 등록 후 닫기
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    {t('imageDetail.submitReply')}
                  </button>
                </div>
              )}



          </div>

          {/* 재귀적으로 답글 렌더링 */}
          {renderReplies(r.id, depth + 1)}
        </div>
      ))
  }

  if (!image) return(
      <header className="w-full flex justify-center p-4 border-b">
        {/* 로딩 중일 때는 아무것도 안 보여주거나 스피너 */}
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-opacity-50"></div>
      </header>
    )

  return (
    <main className="p-6">
      <img
        src={image.body}
        alt={t('imageDetail.emojiAlt')}
        className="w-64 aspect-square object-cover rounded shadow mb-4"
      />
    <span className="text-gray-600">{t('imageDetail.author')} {image.users_info?.nickname}</span>
    <div className="flex gap-2 mt-4">
      <button
        onClick={toggleLike}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition
          ${liked ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        {liked ? (
          <HeartSolid className="w-5 h-5" />
        ) : (
          <HeartOutline className="w-5 h-5" />
        )}
        <span>{likes}</span>
      </button>
      <button
        onClick={() => handleExportToWhatsApp(image.body)}
        className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
      >
        WhatsApp Sticker
      </button>
    </div>



      {/* 댓글 입력 폼 */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">{t('imageDetail.commentSection')}</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('imageDetail.commentPlaceholder')}
            className="flex-1 border rounded px-2 py-1"
          />
          <button
            onClick={handleAddComment}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            {t('imageDetail.submit')}
          </button>
        </div>
      </section>

      {/* 댓글 목록 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">{t('imageDetail.commentList')}</h3>
        {renderReplies()}
      </section>

      {/* QR Code Modal */}
      {showModal && qrCodeUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Scan QR Code to Share on WhatsApp</h2>
            <img src={qrCodeUrl} alt="QR Code" className="w-full mb-4" />
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}