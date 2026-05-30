import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function WorkPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: work } = await supabase
    .from('works')
    .select('*, profiles(nickname, bio)')
    .eq('id', params.id)
    .single()

  if (!work) notFound()

  // 조회수 증가
  await supabase
    .from('works')
    .update({ view_count: (work.view_count || 0) + 1 })
    .eq('id', work.id)

  const isTextGenre = ['단편소설', '시', '수필', '각본'].includes(work.genre)

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(253,250,244,0.88)', backdropFilter: 'blur(14px)', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'serif', fontSize: '20px', color: '#26211C', textDecoration: 'none' }}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </Link>
        <span style={{ color: 'rgba(110,90,60,0.3)', fontSize: '14px' }}>|</span>
        <Link href="/gallery" style={{ fontSize: '13px', color: '#78706A', textDecoration: 'none' }}>← 갤러리</Link>
      </nav>

      {/* 작품 풀스크린 */}
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

        {/* 왼쪽: 작품 */}
        <div style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden', background: '#F0EBE0' }}>
          {work.thumbnail_url ? (
            isTextGenre && !work.thumbnail_url ? null :
            work.genre === '영상'
              ? <video src={work.thumbnail_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <img src={work.thumbnail_url} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isTextGenre ? '#1E1B18' : '#F0EBE0' }}>
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '3px', color: isTextGenre ? 'rgba(255,255,255,0.3)' : '#AFA79F', textTransform: 'uppercase', marginBottom: '24px' }}>{work.genre}</div>
                <div style={{ fontFamily: 'serif', fontSize: '32px', fontWeight: 300, color: isTextGenre ? 'rgba(255,255,255,0.88)' : '#26211C', lineHeight: 1.4 }}>{work.title}</div>
              </div>
            </div>
          )}

          {/* 텍스트 본문 */}
          {isTextGenre && work.content_text && (
            <div style={{ position: 'absolute', inset: 0, background: '#1E1B18', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', overflow: 'auto' }}>
              <div style={{ maxWidth: '520px', width: '100%' }}>
                <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '32px', textAlign: 'center' }}>{work.genre}</div>
                <div style={{ fontFamily: 'serif', fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{work.content_text}</div>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 정보 */}
        <div style={{ flex: '0 0 40%', borderLeft: '0.5px solid rgba(110,90,60,0.22)', background: '#FDFAF4', overflow: 'y auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '52px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '3px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '20px' }}>
            {work.view_count} views
          </div>

          <div style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '5px', padding: '3px 10px', fontSize: '10px', marginBottom: '14px' }}>{work.genre}</div>

          <h1 style={{ fontFamily: 'serif', fontSize: '30px', fontWeight: 400, color: '#26211C', lineHeight: 1.3, letterSpacing: '-0.5px', marginBottom: '16px' }}>{work.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500, color: '#C17B3F' }}>
              {work.profiles?.nickname?.[0]}
            </div>
            <span style={{ fontSize: '13px', color: '#78706A' }}>{work.profiles?.nickname}</span>
          </div>

          <div style={{ width: '28px', height: '1px', background: '#EDD9BC', marginBottom: '22px' }}></div>

          {work.description && (
            <>
              <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '8px' }}>작품 설명</div>
              <p style={{ fontSize: '13px', color: '#78706A', lineHeight: 1.85, marginBottom: '24px', fontWeight: 300 }}>{work.description}</p>
            </>
          )}

          {work.author_note && (
            <>
              <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '8px' }}>작가 노트</div>
              <div style={{ background: '#F7F3EA', borderLeft: '2px solid #EDD9BC', borderRadius: '0 7px 7px 0', padding: '12px 14px', marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#78706A', lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>{work.author_note}</p>
              </div>
            </>
          )}

          <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '8px' }}>저작권</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
            <span style={{ background: '#EFE6D5', color: '#8A6F4A', borderRadius: '5px', padding: '3px 9px', fontSize: '10px' }}>{work.license}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: '#78706A', cursor: 'pointer' }}>
              ♥ {work.like_count || 0}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: '#78706A', cursor: 'pointer' }}>
              ☆ 북마크
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}