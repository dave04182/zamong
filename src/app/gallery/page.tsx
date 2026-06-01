import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const PAGE_SIZE = 24

export default async function GalleryPage({
    searchParams,
}: {
    searchParams: { genre?: string; ai?: string; page?: string; sort?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const genre = searchParams.genre
    const isAi = searchParams.ai === 'true'
    const page = parseInt(searchParams.page || '1')
    const sort = searchParams.sort || 'latest'
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: profile } = user ? await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .single() : { data: null }

    let query = supabase
        .from('works')
        .select('*, profiles(nickname)', { count: 'exact' })
        .range(from, to)

    // 정렬
    if (sort === 'popular') {
        query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false })
    } else if (sort === 'views') {
        query = query.order('view_count', { ascending: false }).order('created_at', { ascending: false })
    } else {
        query = query.order('created_at', { ascending: false })
    }

    if (isAi) {
        query = query.eq('is_ai', true)
    } else {
        query = query.eq('is_ai', false)
        if (genre && genre !== '전체') query = query.eq('genre', genre)
    }

    const { data: works, count } = await query
    const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

    const genres = ['전체', '그림', '사진', '디자인', '단편소설', '시', '수필', '각본', '영상', '현대미술']

    function pageLink(p: number) {
        const params = new URLSearchParams()
        if (genre) params.set('genre', genre)
        if (isAi) params.set('ai', 'true')
        if (sort !== 'latest') params.set('sort', sort)
        params.set('page', String(p))
        return `/gallery?${params.toString()}`
    }

    function sortLink(s: string) {
        const params = new URLSearchParams()
        if (genre) params.set('genre', genre)
        if (isAi) params.set('ai', 'true')
        params.set('sort', s)
        return `/gallery?${params.toString()}`
    }

    const SORTS = [
        { value: 'latest', label: '최신순' },
        { value: 'popular', label: '인기순' },
        { value: 'views', label: '조회순' },
    ]

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
                        <Link href="/auth" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>로그인</Link>
                    )}
                    <Link href="/upload" style={{ fontSize: '13px', color: '#FFFCF7', background: '#C17B3F', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>작품 등록</Link>
                </div>
            </nav>

            <div style={{ padding: '32px 64px' }}>
                {/* 장르 필터 */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {genres.map(g => (
                        <Link key={g} href={`/gallery?genre=${g}${sort !== 'latest' ? `&sort=${sort}` : ''}`} style={{
                            padding: '7px 15px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
                            background: (!isAi && (genre === g || (!genre && g === '전체'))) ? '#26211C' : '#FFFCF7',
                            color: (!isAi && (genre === g || (!genre && g === '전체'))) ? '#FFFCF7' : '#78706A',
                            border: '0.5px solid rgba(110,90,60,0.22)',
                        }}>{g === '전체' ? '전체관' : `${g}관`}</Link>
                    ))}
                    <Link href={`/gallery?ai=true${sort !== 'latest' ? `&sort=${sort}` : ''}`} style={{
                        padding: '7px 15px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
                        background: isAi ? '#26211C' : '#FFFCF7',
                        color: isAi ? '#FFFCF7' : '#78706A',
                        border: '0.5px solid rgba(110,90,60,0.22)',
                    }}>AI 창작관</Link>
                    <Link href="/artists" style={{
                        padding: '7px 15px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
                        background: '#EFE6D5', color: '#8A6F4A',
                        border: '0.5px solid #EDD9BC',
                    }}>✦ 작가관</Link>
                </div>

                {/* 작품 수 + 정렬 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#AFA79F' }}>
                        총 <span style={{ color: '#26211C', fontWeight: 500 }}>{count || 0}</span>개의 작품
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {SORTS.map(s => (
                            <Link key={s.value} href={sortLink(s.value)} style={{
                                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', textDecoration: 'none',
                                background: sort === s.value ? '#26211C' : 'none',
                                color: sort === s.value ? '#FFFCF7' : '#AFA79F',
                                border: `0.5px solid ${sort === s.value ? '#26211C' : 'rgba(110,90,60,0.22)'}`,
                                transition: 'all 0.2s',
                            }}>{s.label}</Link>
                        ))}
                    </div>
                </div>

                {/* 작품 그리드 */}
                {works && works.length > 0 ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '48px' }}>
                            {works.map(work => (
                                <Link
                                    key={work.id}
                                    href={`/works/${work.id}${isAi ? '?ai=true' : genre && genre !== '전체' ? `?genre=${genre}` : ''}${sort !== 'latest' ? `${isAi || (genre && genre !== '전체') ? '&' : '?'}sort=${sort}` : ''}`}
                                    style={{ textDecoration: 'none' }}
                                >
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
                                            <div style={{ fontSize: '11px', color: '#AFA79F', display: 'flex', gap: '8px' }}>
                                                <span>{work.profiles?.nickname}</span>
                                                {sort === 'popular' && <span>♥ {work.like_count || 0}</span>}
                                                {sort === 'views' && <span>👁 {work.view_count || 0}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* 페이지네이션 */}
                        {totalPages >= 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', paddingBottom: '48px' }}>
                                {page > 1 ? (
                                    <Link href={pageLink(page - 1)} style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', textDecoration: 'none', background: '#FFFCF7' }}>‹</Link>
                                ) : (
                                    <span style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '13px', color: '#D0C8BE', border: '0.5px solid rgba(110,90,60,0.1)', background: '#FDFAF4' }}>‹</span>
                                )}

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                                        acc.push(p)
                                        return acc
                                    }, [])
                                    .map((p, i) => p === '...' ? (
                                        <span key={`dots-${i}`} style={{ padding: '7px 4px', fontSize: '13px', color: '#AFA79F' }}>···</span>
                                    ) : (
                                        <Link key={p} href={pageLink(p as number)} style={{
                                            padding: '7px 12px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
                                            background: page === p ? '#26211C' : '#FFFCF7',
                                            color: page === p ? '#FFFCF7' : '#78706A',
                                            border: `0.5px solid ${page === p ? '#26211C' : 'rgba(110,90,60,0.22)'}`,
                                            fontWeight: page === p ? 500 : 400,
                                        }}>{p}</Link>
                                    ))
                                }

                                {page < totalPages ? (
                                    <Link href={pageLink(page + 1)} style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', textDecoration: 'none', background: '#FFFCF7' }}>›</Link>
                                ) : (
                                    <span style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '13px', color: '#D0C8BE', border: '0.5px solid rgba(110,90,60,0.1)', background: '#FDFAF4' }}>›</span>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#AFA79F', fontSize: '14px' }}>
                        아직 등록된 작품이 없어요.
                    </div>
                )}
            </div>
        </div>
    )
}