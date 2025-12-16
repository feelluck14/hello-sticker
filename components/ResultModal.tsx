'use client'

import React from 'react'

interface Props {
  resultImage: string | null
  loading?: boolean
  onClose: () => void
  onUpload: () => Promise<void>
}

export default function ResultModal({ resultImage, loading = false, onClose, onUpload }: Props) {
  return (
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
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 border-opacity-50 mx-auto mb-4"></div>
            <p>이미지 로딩중...</p>
          </div>
        ) : resultImage ? (
          <>
            <img
              src={resultImage}
              alt="결과 이미지"
              style={{
                maxWidth: '80%',
                maxHeight: '400px',
                borderRadius: '8px',
                display: 'block',
                margin: '0 auto'
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'center' }}>
              <a href={resultImage} download="result.jpg">
                <button>📥 다운로드</button>
              </a>
              <button onClick={onUpload}>📤 업로드</button>
              <button onClick={onClose}>❌ 닫기</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
