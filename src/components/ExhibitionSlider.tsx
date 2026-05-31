'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Exhibition = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
}

export default function ExhibitionSlider({ exhibitions }: { exhibitions: Exhibition[] }) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState<number | null>(null)
  const [sliding, setSliding] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('left')
  const total = exhibitions.length

  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(() => {
      slideTo((current + 1) % total, 'left')
    }, 4000)
    return () => clearInterval(timer)
  }, [total, current])

  function slideTo(idx: number, dir: 'left' | 'right') {
    if (sliding || idx === current) return
    setDirection(dir)
    setNext(idx)
    setSliding(true)
    setTimeout(() => {
      setCurrent(idx)
      setNext(null)
      setSliding(false)
    }, 450)
  }

  if (total === 0) {
    return (
      <div style={{ width: '100%', height: '320px', background: '#EDE8DC', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '10px' }}>EXHIBITION</p>
          <p style={{ fontSize: '14px', color: '#AFA79F' }}>준비 중인 기획전이 있어요</p>
        </div>
      </div>
    )
  }

  const slideOffset = direction === 'left' ? -100 : 100

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#AFA79F', textTransform: 'uppercase', margin: 0 }}>EXHIBITION</p>
        <a href="/exhibitions" style={{ fontSize: '12px', color: '#AFA79F', textDecoration: 'none' }}>
          기획전 전체보기 →
        </a>
      </div>

      {/* 슬라이드 컨테이너 */}
      <div style={{ width: '100%', height: '300px', borderRadius: '14px', overflow: 'hidden', position: 'relative', background: '#1E1B18' }}>

        {/* 현재 카드 */}
        <div
          onClick={() => !sliding && router.push(`/exhibitions/${exhibitions[current].id}`)}
          style={{
            position: 'absolute', inset: 0, cursor: 'pointer',
            transform: sliding ? `translateX(${slideOffset}%)` : 'translateX(0)',
            transition: sliding ? 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}
        >
          <ExhibitionCard exhibition={exhibitions[current]} />
        </div>

        {/* 다음 카드 */}
        {sliding && next !== null && (
          <div
            onClick={() => router.push(`/exhibitions/${exhibitions[next].id}`)}
            style={{
              position: 'absolute', inset: 0, cursor: 'pointer',
              transform: sliding ? 'translateX(0)' : `translateX(${-slideOffset}%)`,
              transition: 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animation: `slideIn${direction === 'left' ? 'Right' : 'Left'} 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            }}
          >
            <ExhibitionCard exhibition={exhibitions[next]} />
          </div>
        )}

        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>

      {/* 하단 컨트롤 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
        <button
          onClick={() => slideTo((current - 1 + total) % total, 'right')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#AFA79F', padding: '4px 8px', lineHeight: 1 }}
        >‹</button>
        <span style={{ fontSize: '12px', color: '#78706A', letterSpacing: '0.5px' }}>
          <span style={{ color: '#26211C', fontWeight: 500 }}>{current + 1}</span>
          <span style={{ color: '#AFA79F', margin: '0 4px' }}>/</span>
          <span style={{ color: '#AFA79F' }}>{total}</span>
        </span>
        <button
          onClick={() => slideTo((current + 1) % total, 'left')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#AFA79F', padding: '4px 8px', lineHeight: 1 }}
        >›</button>
      </div>

      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
          {exhibitions.map((_, i) => (
            <button
              key={i}
              onClick={() => slideTo(i, i > current ? 'left' : 'right')}
              style={{
                width: i === current ? '16px' : '6px',
                height: '6px', borderRadius: '3px',
                background: i === current ? '#26211C' : 'rgba(110,90,60,0.25)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ExhibitionCard({ exhibition }: { exhibition: { title: string; description: string | null; thumbnail_url: string | null } }) {
  return (
    <>
      {exhibition.thumbnail_url ? (
        <img src={exhibition.thumbnail_url} alt={exhibition.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2A2520 0%, #1A1510 100%)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '8px' }}>기획전</p>
        <h3 style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 400, color: 'rgba(255,255,255,0.92)', margin: '0 0 6px', lineHeight: 1.3 }}>{exhibition.title}</h3>
        {exhibition.description && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {exhibition.description}
          </p>
        )}
      </div>
    </>
  )
}