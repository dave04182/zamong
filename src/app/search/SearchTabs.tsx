'use client'

import { useRouter } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'

export default function SearchTabs({ currentType, q }: { currentType: string; q: string }) {
  const router = useRouter()
  const workRef = useRef<HTMLButtonElement>(null)
  const artistRef = useRef<HTMLButtonElement>(null)
  const [barStyle, setBarStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeRef = currentType === 'work' ? workRef : artistRef
    const btn = activeRef.current
    if (btn) {
      setBarStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
      })
    }
  }, [currentType])

  function handleTab(type: string) {
    router.push(`/search?q=${q}&type=${type}`)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', gap: '0', marginTop: '16px' }}>
      <button
        ref={workRef}
        onClick={() => handleTab('work')}
        style={{
          padding: '10px 20px', fontSize: '13px', background: 'none', border: 'none',
          color: currentType === 'work' ? '#26211C' : '#AFA79F',
          fontWeight: currentType === 'work' ? 500 : 400,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >작품</button>
      <button
        ref={artistRef}
        onClick={() => handleTab('artist')}
        style={{
          padding: '10px 20px', fontSize: '13px', background: 'none', border: 'none',
          color: currentType === 'artist' ? '#26211C' : '#AFA79F',
          fontWeight: currentType === 'artist' ? 500 : 400,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >작가</button>

      {/* 슬라이딩 바 */}
      <div style={{
        position: 'absolute', bottom: 0, height: '2px',
        background: '#26211C',
        left: barStyle.left,
        width: barStyle.width,
        transition: 'left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }} />

      {/* 전체 하단 선 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '0.5px', background: 'rgba(110,90,60,0.15)',
      }} />
    </div>
  )
}