'use client'

import { useEffect, useState } from 'react'

type Post = {
  id: number
  body: string   // 이미지 URL
  user_id: number
  status: string
  created_at: string
}

export default function ImageBoardPage() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      const res = await fetch('/api/image-posts')
      const data = await res.json()
      setPosts(data)
    }
    fetchPosts()
  }, [])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>📸 이미지 게시판</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {posts.map((post) => (
          <div key={post.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
            <img src={post.body} alt="게시글 이미지" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            <div style={{ padding: '10px' }}>
              <small>작성자: {post.user_id}</small><br />
              <small>{new Date(post.created_at).toLocaleString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}