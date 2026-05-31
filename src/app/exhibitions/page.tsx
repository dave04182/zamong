import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ExhibitionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase
    .from('profiles').select('nickname, is_admin').eq('id', user.id).single() : { data: null }

  const { data: exhibitions } = await supabase
    .from('exhibitions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: 'rgba(253,250,244,0.88)', backdropFilter: 'blur(14px)', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'serif', fontSize: '22px', color: '#26211C', textDecoration: 'none' }}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          {profile?.is_admin && (
            <Link href="/admin/exhibitions/new" style={{ fontSize: '13px', color: '#FFFCF7', background: '#C17B3F', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>+ 기획전 만들기</Link>
          )}
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
        </div>
      </nav>

      <div style={{ padding: '48px 64px' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '2.5px', color: '#C17B3F', textTransform: 'uppercase', marginBottom: '12px' }}>CURATED EXHIBITIONS</p>
          <h1 style={{ fontFamily: 'serif', fontSize: '36px', fontWeight: 400, color: '#26211C', letterSpacing: '-0.5px' }}>기획전</h1>
        </div>

        {exhibitions && exhibitions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {exhibitions.map((ex: any) => (
              <Link key={ex.id} href={`/exhibitions/${ex.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s' }}>
                  {/* 썸네일 */}
                  <div style={{ height: '200px', background: ex.thumbnail_url ? 'none' : '#F0EBE0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ex.thumbnail_url
                      ? <img src={ex.thumbnail_url} alt={ex.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ textAlign: 'center', padding: '32px' }}>
                          <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#26211C', lineHeight: 1.4 }}>{ex.title}</div>
                        </div>
                    }
                  </div>
                  <div style={{ padding: '20px 22px 22px' }}>
                    <h2 style={{ fontFamily: 'serif', fontSize: '18px', fontWeight: 400, color: '#26211C', marginBottom: '8px' }}>{ex.title}</h2>
                    <p style={{ fontSize: '13px', color: '#78706A', lineHeight: 1.7, marginBottom: '12px' }}>{ex.description}</p>
                    <div style={{ fontSize: '11px', color: '#AFA79F' }}>
                      {new Date(ex.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#AFA79F', fontSize: '14px' }}>
            아직 진행 중인 기획전이 없어요.
          </div>
        )}
      </div>
    </div>
  )
}