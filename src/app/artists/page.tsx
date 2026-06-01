import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ArtistsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single() : { data: null }

  const { data: artists } = await supabase
    .from('profiles')
    .select('*, works(count)')
    .eq('is_public', true)
    .order('nickname', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(253,250,244,0.88)', backdropFilter: 'blur(14px)', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'serif', fontSize: '22px', color: '#26211C', textDecoration: 'none' }}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          {user ? (
            <>
              <Link href="/search" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>검색</Link>
              <Link href={`/profile/${profile?.nickname}`} style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>마이페이지</Link>
              <form action="/auth/signout" method="POST">
                <button type="submit" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', background: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>로그아웃</button>
              </form>
            </>
          ) : (
            <Link href="/auth" style={{ fontSize: '13px', color: '#FFFCF7', background: '#26211C', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>로그인</Link>
          )}
        </div>
      </nav>

      <div style={{ padding: '48px 64px' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '2.5px', color: '#C17B3F', textTransform: 'uppercase', marginBottom: '12px' }}>ARTISTS</p>
          <h1 style={{ fontFamily: 'serif', fontSize: '36px', fontWeight: 400, color: '#26211C', letterSpacing: '-0.5px' }}>작가</h1>
          <p style={{ fontSize: '14px', color: '#AFA79F', marginTop: '8px' }}>자몽에서 활동 중인 작가들을 만나보세요.</p>
        </div>

        {artists && artists.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {artists.map((artist: any) => (
              <Link key={artist.id} href={`/profile/${artist.nickname}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s' }}>
                  {/* 아바타 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 500, color: '#C17B3F', overflow: 'hidden', flexShrink: 0 }}>
                      {artist.avatar_url
                        ? <img src={artist.avatar_url} alt={artist.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : artist.nickname[0]
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#26211C', marginBottom: '3px' }}>{artist.nickname}</div>
                      <div style={{ fontSize: '11px', color: '#AFA79F' }}>작품 {artist.works?.[0]?.count || 0}개</div>
                    </div>
                  </div>

                  {/* 장르 태그 */}
                  {artist.main_genre && artist.main_genre.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {artist.main_genre.slice(0, 3).map((g: string) => (
                        <span key={g} style={{ fontSize: '10px', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '4px', padding: '2px 8px' }}>{g}</span>
                      ))}
                    </div>
                  )}

                  {/* 소개글 */}
                  {artist.bio && (
                    <p style={{ fontSize: '12px', color: '#78706A', lineHeight: 1.7, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {artist.bio}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#AFA79F', fontSize: '14px' }}>
            아직 등록된 작가가 없어요.
          </div>
        )}
      </div>
    </div>
  )
}