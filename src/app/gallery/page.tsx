import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: { genre?: string; ai?: string }
}) {
  const supabase = await createClient()
  const genre = searchParams.genre
  const isAi = searchParams.ai === 'true'

  let query = supabase
    .from('works')
    .select('*, profiles(nickname)')
    .order('created_at', { ascending: false })

  if (isAi) {
    query = query.eq('is_ai', true)
  } else {
    query = query.eq('is_ai', false)
    if (genre && genre !== '전체') query = query.eq('genre', genre)
  }

  const { data: works } = await query

  const genres = ['전체', '그림', '사진', '디자인', '단편소설', '시', '수필', '각본', '영상', '현대미술']

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(253,250,244,0.88)', backdropFilter: 'blur(14px)', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'serif', fontSize: '22px', color: '#26211C', textDecoration: 'none' }}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/auth" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>로그인</Link>
          <Link href="/upload" style={{ fontSize: '13px', color: '#FFFCF7', background: '#C17B3F', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>작품 등록</Link>
        </div>
      </nav>

      <div style={{ padding: '32px 64px' }}>
        {/* 장르 필터 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {genres.map(g => (
            <Link key={g} href={`/gallery?genre=${g}`} style={{
              padding: '7px 15px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
              background: (!isAi && (genre === g || (!genre && g === '전체'))) ? '#26211C' : '#FFFCF7',
              color: (!isAi && (genre === g || (!genre && g === '전체'))) ? '#FFFCF7' : '#78706A',
              border: '0.5px solid rgba(110,90,60,0.22)',
            }}>{g}</Link>
          ))}
          <Link href="/gallery?ai=true" style={{
            padding: '7px 15px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
            background: isAi ? '#26211C' : '#EFE6D5',
            color: isAi ? '#FFFCF7' : '#8A6F4A',
            border: '0.5px solid #EDD9BC',
          }}>✨ AI 창작관</Link>
        </div>

        {/* 작품 그리드 */}
        {works && works.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {works.map(work => (
              <Link key={work.id} href={`/works/${work.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '180px', background: '#F0EBE0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {work.thumbnail_url
                      ? <img src={work.thumbnail_url} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ textAlign: 'center', padding: '20px' }}>
                          <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '8px' }}>{work.genre}</div>
                          <div style={{ fontFamily: 'serif', fontSize: '16px', color: '#26211C', lineHeight: 1.5 }}>{work.title}</div>
                        </div>
                    }
                  </div>
                  <div style={{ padding: '10px 12px 14px' }}>
                    <div style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', marginBottom: '6px' }}>{work.genre}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#26211C', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{work.title}</div>
                    <div style={{ fontSize: '11px', color: '#AFA79F' }}>{work.profiles?.nickname}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#AFA79F', fontSize: '14px' }}>
            아직 등록된 작품이 없어요.
          </div>
        )}
      </div>
    </div>
  )
}