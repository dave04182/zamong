import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ExhibitionSlider from '@/components/ExhibitionSlider'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: works } = await supabase
    .from('works')
    .select('*, profiles(nickname)')
    .eq('is_ai', false)
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single() : { data: null }

  const { data: exhibitions } = await supabase
    .from('exhibitions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(253,250,244,0.88)', backdropFilter: 'blur(14px)', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: 'serif', fontSize: '22px', color: '#26211C' }}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/search" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>검색</Link>
          <Link href="/gallery" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>갤러리</Link>
          {user ? (
            <>
              <Link href={`/profile/${profile?.nickname}`} style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>마이페이지</Link>
              <form action="/auth/signout" method="POST">
                <button type="submit" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', background: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>로그아웃</button>
              </form>
            </>
          ) : (
            <Link href="/auth" style={{ fontSize: '13px', color: '#FFFCF7', background: '#26211C', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>로그인</Link>
          )}
          <Link href="/upload" style={{ fontSize: '13px', color: '#FFFCF7', background: '#C17B3F', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>작품 등록</Link>
        </div>
      </nav>

      {/* HERO — 좌측 카피 + 우측 기획전 슬라이더 */}
      <div style={{ background: '#F7F3EA', borderBottom: '0.5px solid rgba(110,90,60,0.12)', padding: '80px 64px', display: 'flex', gap: '64px', alignItems: 'center' }}>
        {/* 왼쪽 */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', letterSpacing: '2.5px', color: '#C17B3F', textTransform: 'uppercase', marginBottom: '18px' }}>온라인 전시 플랫폼</p>
          <h1 style={{ fontFamily: 'serif', fontSize: '48px', fontWeight: 400, color: '#26211C', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: '18px' }}>
            당신의 작품을<br /><strong style={{ fontWeight: 500 }}>세상에 전시하세요</strong>
          </h1>
          <p style={{ fontSize: '15px', color: '#78706A', lineHeight: 1.8, marginBottom: '32px' }}>
            이메일 하나로 가입하고, 나만의 갤러리를 만들어보세요.<br />
            그림, 시, 소설, 사진, 영상 — 모든 창작이 여기에.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/gallery" style={{ fontSize: '14px', color: '#FFFCF7', background: '#26211C', borderRadius: '10px', padding: '12px 24px', textDecoration: 'none' }}>갤러리 둘러보기</Link>
            <Link href="/upload" style={{ fontSize: '14px', color: '#26211C', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '10px', padding: '12px 24px', textDecoration: 'none' }}>작품 등록하기</Link>
          </div>
        </div>

        {/* 오른쪽 — 기획전 슬라이더 */}
        <div style={{ flex: '0 0 360px' }}>
          <ExhibitionSlider exhibitions={exhibitions || []} />
        </div>
      </div>

      {/* 전시관 장르 */}
      <div style={{ padding: '40px 64px 180px' }}>
        <h2 style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 400, color: '#26211C', marginBottom: '20px' }}>전시관</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '48px' }}>
          {['전체', '그림', '사진', '디자인', '단편소설', '시', '수필', '각본', '영상', '현대미술'].map(g => (
            <Link key={g} href={`/gallery?genre=${g}`} style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px',
              background: g === '전체' ? '#26211C' : '#FFFCF7',
              color: g === '전체' ? '#FFFCF7' : '#78706A',
              border: '0.5px solid rgba(110,90,60,0.22)',
              textDecoration: 'none',
            }}>{g === '전체' ? '전체관' : `${g}관`}</Link>
          ))}
          <Link href="/gallery?ai=true" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', background: '#FFFCF7', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', textDecoration: 'none' }}>AI 창작관</Link>
          <Link href="/artists" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', background: '#EFE6D5', color: '#8A6F4A', border: '0.5px solid #EDD9BC', textDecoration: 'none' }}>✦ 작가관</Link>
        </div>
        {/* 최근 등록작 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'serif', fontSize: '20px', fontWeight: 400, color: '#26211C' }}>최근 등록작</h2>
          <Link href="/gallery" style={{ fontSize: '13px', color: '#AFA79F', textDecoration: 'none' }}>전체 보기 →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {works?.map(work => (
            <Link key={work.id} href={`/works/${work.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s' }}>
                <div style={{ height: '160px', background: '#F0EBE0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {work.thumbnail_url
                    ? <img src={work.thumbnail_url} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '8px' }}>{work.genre}</div>
                      <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#26211C', lineHeight: 1.5 }}>{work.title}</div>
                    </div>
                  }
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', marginBottom: '5px' }}>{work.genre}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#26211C', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{work.title}</div>
                  <div style={{ fontSize: '11px', color: '#AFA79F' }}>{work.profiles?.nickname}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}