'use client'

import React from 'react'

interface Props {
  resultImage: string
  onClose: () => void
  onUpload: () => Promise<void>
}

export default function ResultModal({ resultImage, onClose, onUpload }: Props) {
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
        <img src={resultImage} alt="결과 이미지" style={{ width: '50%', borderRadius: '8px' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'center' }}>
          <a href={resultImage} download="result.jpg">
            <button>📥 다운로드</button>
          </a>
          <button onClick={onUpload}>📤 업로드</button>
          <button onClick={onClose}>❌ 닫기</button>
        </div>
      </div>
    </div>
  )
}
