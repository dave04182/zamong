import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import WorkViewer from '../../../components/WorkViewer'

export default async function WorkPage({
    params,
    searchParams,
}: {
    params: { id: string }
    searchParams: { genre?: string; ai?: string; from?: string; userId?: string }
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: work } = await supabase
        .from('works')
        .select('*, profiles(nickname, bio, avatar_url)')
        .eq('id', params.id)
        .single()

    if (!work) notFound()

    let query = supabase
        .from('works')
        .select('*, profiles(nickname, bio, avatar_url)')
        .order('created_at', { ascending: false })

    if (searchParams.from === 'profile' && searchParams.userId) {
        query = query.eq('user_id', searchParams.userId).eq('is_ai', false)
    } else if (searchParams.ai === 'true') {
        query = query.eq('is_ai', true)
    } else if (searchParams.genre && searchParams.genre !== '전체') {
        query = query.eq('is_ai', false).eq('genre', searchParams.genre)
    } else {
        query = query.eq('is_ai', false)
    }

    const { data: allWorks } = await query

    const { data: reviews } = await supabase
        .from('reviews')
        .select('*, profiles(nickname, avatar_url)')
        .eq('work_id', params.id)
        .order('created_at', { ascending: false })

    const { data: thankedReviews } = user ? await supabase
        .from('review_thanks')
        .select('review_id')
        .eq('user_id', user.id) : { data: [] }
    const thankedIds = thankedReviews?.map((t: any) => t.review_id) || []

    const { data: likedWorks } = user ? await supabase
        .from('likes')
        .select('work_id')
        .eq('user_id', user.id) : { data: [] }
    const likedIds = likedWorks?.map((l: any) => l.work_id) || []

    const { data: bookmarkedWorks } = user ? await supabase
        .from('bookmarks')
        .select('work_id')
        .eq('user_id', user.id) : { data: [] }
    const bookmarkedIds = bookmarkedWorks?.map((b: any) => b.work_id) || []

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ height: '100vh', overflow: 'hidden' }}>
                <nav style={{ background: 'rgba(253,250,244,0.88)', backdropFilter: 'blur(14px)', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                    <Link href="/" style={{ fontFamily: 'serif', fontSize: '20px', color: '#26211C', textDecoration: 'none' }}>
                        자<span style={{ color: '#C17B3F' }}>몽</span>
                    </Link>
                    <span style={{ color: 'rgba(110,90,60,0.3)', fontSize: '14px' }}>|</span>
                    <Link
                        href={
                            searchParams.from === 'profile' && searchParams.userId
                                ? `/profile/${work.profiles?.nickname}`
                                : searchParams.genre ? `/gallery?genre=${searchParams.genre}`
                                : searchParams.ai ? '/gallery?ai=true'
                                : '/gallery'
                        }
                        style={{ fontSize: '13px', color: '#78706A', textDecoration: 'none' }}
                    >
                        ← {
                            searchParams.from === 'profile' ? '내 작품'
                            : searchParams.genre && searchParams.genre !== '전체' ? searchParams.genre
                            : searchParams.ai === 'true' ? 'AI 창작관'
                            : '갤러리'
                        }
                    </Link>
                </nav>

                <WorkViewer
                    works={allWorks || []}
                    initialId={params.id}
                    initialReviews={reviews || []}
                    currentUserId={user?.id || null}
                    initialThankedIds={thankedIds}
                    initialLikedIds={likedIds}
                    initialBookmarkedIds={bookmarkedIds}
                />
            </div>
        </div>
    )
}