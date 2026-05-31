import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SearchTabs from './SearchTabs'

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { q?: string; type?: string }
}) {
    const supabase = await createClient()
    const q = searchParams.q?.trim() || ''
    const type = searchParams.type || 'work'

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = user ? await supabase
        .from('profiles').select('nickname').eq('id', user.id).single() : { data: null }

    let works: any[] = []
    let artists: any[] = []

    if (q && type === 'work') {
        const { data: byTitle } = await supabase
            .from('works')
            .select('*, profiles(nickname, avatar_url)')
            .ilike('title', `%${q}%`)
            .eq('is_ai', false)
            .order('created_at', { ascending: false })

        const { data: byTag } = await supabase
            .from('works')
            .select('*, profiles(nickname, avatar_url)')
            .contains('tags', [q])
            .eq('is_ai', false)
            .order('created_at', { ascending: false })

        const merged = [...(byTitle || []), ...(byTag || [])]
        const seen = new Set()
        works = merged.filter(w => {
            if (seen.has(w.id)) return false
            seen.add(w.id)
            return true
        })
    }

    if (q && type === 'artist') {
        const { data: matchedProfiles } = await supabase
            .from('profiles')
            .select('*')
            .ilike('nickname', `%${q}%`)
            .order('nickname', { ascending: true })

        artists = matchedProfiles || []

        for (const artist of artists) {
            const { count } = await supabase
                .from('works')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', artist.id)
                .eq('is_ai', false)
            artist.work_count = count || 0
        }
    }

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

            {/* 검색 영역 — 중앙 정렬 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 64px 32px' }}>
                <form action="/search" method="GET" style={{ width: '100%', maxWidth: '520px' }}>
                    <input type="hidden" name="type" value={type} />
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '0' }}>
                        <input
                            name="q"
                            defaultValue={q}
                            placeholder="작품명, 태그, 작가 닉네임 등으로 검색해보세요"
                            style={{ flex: 1, padding: '11px 16px', background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '10px', fontSize: '14px', color: '#26211C', outline: 'none', fontFamily: 'inherit' }}
                        />
                        <button type="submit" style={{ padding: '11px 22px', background: '#26211C', color: '#FFFCF7', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            검색
                        </button>
                    </div>
                </form>

                {/* 타입 탭 — 중앙, 줄 길이 글자에 맞게 */}
                <div style={{ display: 'flex', gap: '0', marginTop: '16px' }}>
                    <SearchTabs currentType={type} q={q} />
                </div>
            </div>

            {/* 결과 영역 */}
            <div style={{ padding: '0 64px 48px' }}>

                {/* 작품 결과 */}
                {q && type === 'work' && (
                    <>
                        <div style={{ marginBottom: '24px' }}>
                            <span style={{ fontFamily: 'serif', fontSize: '18px', color: '#26211C' }}>"{q}"</span>
                            <span style={{ fontSize: '14px', color: '#AFA79F', marginLeft: '10px' }}>{works.length}개의 작품</span>
                        </div>
                        {works.length > 0 ? (
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
                                                <div style={{ fontSize: '11px', color: '#AFA79F', marginBottom: '6px' }}>{work.profiles?.nickname}</div>
                                                {work.tags && work.tags.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                        {work.tags.map((tag: string) => (
                                                            <span key={tag} style={{
                                                                fontSize: '10px', padding: '2px 7px', borderRadius: '20px',
                                                                background: tag === q ? '#26211C' : '#EFE6D5',
                                                                color: tag === q ? '#FFFCF7' : '#8A6F4A',
                                                            }}>#{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#AFA79F', fontSize: '14px' }}>검색 결과가 없어요.</div>
                        )}
                    </>
                )}

                {/* 작가 결과 */}
                {q && type === 'artist' && (
                    <>
                        <div style={{ marginBottom: '24px' }}>
                            <span style={{ fontFamily: 'serif', fontSize: '18px', color: '#26211C' }}>"{q}"</span>
                            <span style={{ fontSize: '14px', color: '#AFA79F', marginLeft: '10px' }}>{artists.length}명의 작가</span>
                        </div>
                        {artists.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '560px' }}>
                                {artists.map((artist: any) => (
                                    <Link key={artist.id} href={`/profile/${artist.nickname}`} style={{ textDecoration: 'none' }}>
                                        <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 500, color: '#C17B3F', overflow: 'hidden', flexShrink: 0 }}>
                                                {artist.avatar_url
                                                    ? <img src={artist.avatar_url} alt={artist.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : artist.nickname[0]
                                                }
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '15px', fontWeight: 500, color: '#26211C', marginBottom: '4px' }}>{artist.nickname}</div>
                                                {artist.bio && <div style={{ fontSize: '12px', color: '#78706A', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist.bio}</div>}
                                                {artist.main_genre && artist.main_genre.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                        {artist.main_genre.map((g: string) => (
                                                            <span key={g} style={{ fontSize: '10px', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '4px', padding: '2px 7px' }}>{g}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                                <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#26211C' }}>{artist.work_count}</div>
                                                <div style={{ fontSize: '10px', color: '#AFA79F' }}>작품</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#AFA79F', fontSize: '14px' }}>검색 결과가 없어요.</div>
                        )}
                    </>
                )}


            </div>
        </div>
    )
}