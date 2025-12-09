'use client'

import React from 'react'

interface Props {
  open: boolean
  onClose: () => void
  uploadimages: any[]
  loading: boolean
  upimgpage: number
  setupimgPage: (n: number) => void
  handleImageSelect: (url: string) => void
  handleImguploadClick: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  getUrl: (name: string) => string
}

export default function ImageUploadModal({
  open,
  onClose,
  uploadimages,
  loading,
  upimgpage,
  setupimgPage,
  handleImageSelect,
  handleImguploadClick,
  fileInputRef,
  handleImageChange,
  getUrl,
}: Props) {
  if (!open) return null

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
        }}
      >
        <h3>📋 업로드 이미지 목록</h3>

        {loading ? (
          <header className="w-full flex justify-center p-4 border-b">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-opacity-50"></div>
          </header>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              padding: '20px',
            }}
          >
            {uploadimages
              .slice(upimgpage * 8, upimgpage * 8 + 8)
              .map((img) => {
                const url = getUrl(img.name)
                return (
                  <button
                    key={img.name}
                    onClick={() => handleImageSelect(url)}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      backgroundColor: '#f9f9f9',
                      height: '120px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                )
              })}

            {/* 가운데 + 버튼 */}
            <div
              onClick={handleImguploadClick}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#eee',
                borderRadius: '12px',
                cursor: 'pointer',
                height: '120px',
              }}
            >
              <span style={{ fontSize: '32px', color: '#666' }}>＋</span>
            </div>

            {/* 숨겨진 파일 입력 */}
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
          </div>
        )}

        {/* 페이지네이션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <button disabled={upimgpage === 0} onClick={() => setupimgPage(upimgpage - 1)}>
            ◀ 이전
          </button>
          <span>{upimgpage + 1} 페이지</span>
          <button disabled={(upimgpage + 1) * 6 >= uploadimages.length} onClick={() => setupimgPage(upimgpage + 1)}>
            다음 ▶
          </button>
        </div>

        <button onClick={onClose} style={{ marginTop: '10px' }}>
          ❌ 닫기
        </button>
      </div>
    </div>
  )
}
