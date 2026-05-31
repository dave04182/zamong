'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReviewSection from '@/app/works/[id]/ReviewSection'

type Work = {
    id: string
    user_id: string
    title: string
    genre: string
    description: string | null
    author_note: string | null
    license: string
    thumbnail_url: string | null
    content_text: string | null
    like_count: number
    view_count: number
    is_ai: boolean
    tags: string[] | null
    profiles: { nickname: string; bio: string | null; avatar_url: string | null } | null
}

type Review = {
    id: string
    content: string
    thanks_count: number
    created_at: string
    profiles: { nickname: string; avatar_url: string | null } | null
}

export default function ExhibitionViewer({
    exhibition,
    works,
    initialReviews,
    currentUserId,
    initialThankedIds,
    initialLikedIds,
    initialBookmarkedIds,
    isAdmin,
    exhibitionId,
}: {
    exhibition: any
    works: Work[]
    initialReviews: Review[]
    currentUserId: string | null
    initialThankedIds: string[]
    initialLikedIds: string[]
    initialBookmarkedIds: string[]
    isAdmin: boolean
    exhibitionId: string
}) {
    const supabase = createClient()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [currentIndex, setCurrentIndex] = useState(-1)
    const isScrolling = useRef(false)
    const [darkMode, setDarkMode] = useState(true)
    const [showReviews, setShowReviews] = useState(false)
    const [likedIds, setLikedIds] = useState<string[]>(initialLikedIds)
    const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(initialBookmarkedIds)
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
        Object.fromEntries(works.map(w => [w.id, w.like_count || 0]))
    )

    const isTextGenre = (genre: string) => ['단편소설', '시', '수필', '각본'].includes(genre)
    const totalSections = works.length + 1

    const scrollToIndex = (idx: number) => {
        const el = scrollRef.current
        if (!el || isScrolling.current) return
        isScrolling.current = true

        const sectionHeight = window.innerHeight
        const targetY = idx * sectionHeight
        const startY = el.scrollTop
        const diff = targetY - startY
        const duration = 900
        let start: number | null = null

        const easeInOut = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

        const step = (timestamp: number) => {
            if (!start) start = timestamp
            const elapsed = timestamp - start
            const progress = Math.min(elapsed / duration, 1)
            el.scrollTop = startY + diff * easeInOut(progress)
            if (progress < 1) {
                requestAnimationFrame(step)
            } else {
                isScrolling.current = false
                setCurrentIndex(idx - 1)
                setShowReviews(false)
            }
        }

        requestAnimationFrame(step)
    }

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement
            if (target.closest('[data-text-panel]')) return
            e.preventDefault()
            if (isScrolling.current) return

            const sectionHeight = window.innerHeight
            const currentScroll = Math.round(el.scrollTop / sectionHeight)

            if (e.deltaY > 0 && currentScroll < totalSections - 1) {
                scrollToIndex(currentScroll + 1)
            } else if (e.deltaY < 0 && currentScroll > 0) {
                scrollToIndex(currentScroll - 1)
            }
        }

        el.addEventListener('wheel', handleWheel, { passive: false })
        return () => el.removeEventListener('wheel', handleWheel)
    }, [totalSections])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const handleScroll = () => {
            const sectionHeight = window.innerHeight
            const idx = Math.round(el.scrollTop / sectionHeight)
            setCurrentIndex(idx - 1)
        }

        el.addEventListener('scroll', handleScroll, { passive: true })
        return () => el.removeEventListener('scroll', handleScroll)
    }, [])

    async function handleLike(workId: string) {
        if (!currentUserId) { window.location.href = '/auth'; return }
        const already = likedIds.includes(workId)
        if (already) {
            await supabase.from('likes').delete().eq('user_id', currentUserId).eq('work_id', workId)
            await supabase.from('works').update({ like_count: Math.max(0, (likeCounts[workId] || 1) - 1) }).eq('id', workId)
            setLikedIds(prev => prev.filter(id => id !== workId))
            setLikeCounts(prev => ({ ...prev, [workId]: Math.max(0, (prev[workId] || 1) - 1) }))
        } else {
            await supabase.from('likes').insert({ user_id: currentUserId, work_id: workId })
            await supabase.from('works').update({ like_count: (likeCounts[workId] || 0) + 1 }).eq('id', workId)
            setLikedIds(prev => [...prev, workId])
            setLikeCounts(prev => ({ ...prev, [workId]: (prev[workId] || 0) + 1 }))
        }
    }

    async function handleBookmark(workId: string) {
        if (!currentUserId) { window.location.href = '/auth'; return }
        const already = bookmarkedIds.includes(workId)
        if (already) {
            await supabase.from('bookmarks').delete().eq('user_id', currentUserId).eq('work_id', workId)
            setBookmarkedIds(prev => prev.filter(id => id !== workId))
        } else {
            await supabase.from('bookmarks').insert({ user_id: currentUserId, work_id: workId })
            setBookmarkedIds(prev => [...prev, workId])
        }
    }

    return (
        <div ref={scrollRef} style={{ height: '100vh', overflowY: 'scroll' }}>
            {/* NAV — pointer-events none으로 클릭 가로채기 방지 */}
            <nav style={{
                padding: '0 48px', height: '56px',
                display: 'flex', alignItems: 'center',
                position: 'fixed', top: 0, left: 0, right: 0,
                zIndex: 300, pointerEvents: 'none',
            }}>
                <a href="/exhibitions" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', pointerEvents: 'auto' }}>
                    ← 기획전 목록
                </a>
            </nav>

            <div style={{ height: `${totalSections * 100}vh` }}>

                {/* 인트로 섹션 */}
                <div style={{ height: '100vh', position: 'sticky', top: 0, zIndex: 1, background: '#1E1B18', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '0 48px', maxWidth: '640px' }}>
                        <p style={{ fontSize: '11px', letterSpacing: '3px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '24px' }}>CURATED EXHIBITION</p>
                        <h1 style={{ fontFamily: 'serif', fontSize: '44px', fontWeight: 400, color: 'rgba(255,255,255,0.92)', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: '24px' }}>{exhibition.title}</h1>
                        {exhibition.curator_note && (
                            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.9, marginBottom: '40px', fontWeight: 300 }}>{exhibition.curator_note}</p>
                        )}
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '48px' }}>작품 {works.length}점</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', opacity: 0.4 }}>
                            <span style={{ fontSize: '9px', letterSpacing: '2px', color: 'white', textTransform: 'uppercase' }}>scroll</span>
                            <div style={{ width: '14px', height: '14px', borderRight: '1.5px solid white', borderBottom: '1.5px solid white', transform: 'rotate(45deg)' }}></div>
                        </div>
                    </div>
                    <style>{`@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
                </div>

                {/* 작품 섹션들 */}
                {works.map((work, idx) => (
                    <div key={work.id} style={{ height: '100vh', position: 'sticky', top: 0, zIndex: idx + 2, display: 'flex' }}>
                        {/* 작품 패널 */}
                        <div style={{
                            flex: '0 0 60%', order: idx % 2 === 0 ? 0 : 1,
                            position: 'relative', overflow: 'hidden',
                            background: isTextGenre(work.genre) ? (darkMode ? '#1E1B18' : '#FDFAF4') : '#F0EBE0'
                        }}>
                            {work.thumbnail_url && (
                                work.genre === '영상'
                                    ? <video src={work.thumbnail_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    : <img src={work.thumbnail_url} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            )}

                            {isTextGenre(work.genre) && work.content_text && (
                                <div data-text-panel="true" style={{ position: 'absolute', inset: 0, background: darkMode ? '#1E1B18' : '#FDFAF4', overflowY: 'auto', padding: '60px' }}>
                                    <button onClick={() => setDarkMode(d => !d)} style={{ position: 'sticky', top: 0, float: 'right', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '11px', color: darkMode ? 'rgba(255,255,255,0.5)' : '#AFA79F', cursor: 'pointer', letterSpacing: '1px', marginBottom: '16px' }}>
                                        {darkMode ? '☀ 밝게' : '🌙 어둡게'}
                                    </button>
                                    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                                        <div style={{ fontSize: '10px', letterSpacing: '3px', color: darkMode ? 'rgba(255,255,255,0.25)' : '#AFA79F', textTransform: 'uppercase', marginBottom: '32px', textAlign: 'center' }}>{work.genre}</div>
                                        <div style={{ fontFamily: 'serif', fontSize: '16px', color: darkMode ? 'rgba(255,255,255,0.85)' : '#26211C', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{work.content_text}</div>
                                    </div>
                                </div>
                            )}

                            {isTextGenre(work.genre) && !work.content_text && !work.thumbnail_url && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E1B18' }}>
                                    <div style={{ textAlign: 'center', padding: '60px' }}>
                                        <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '24px' }}>{work.genre}</div>
                                        <div style={{ fontFamily: 'serif', fontSize: '32px', fontWeight: 300, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>{work.title}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 정보 패널 */}
                        <div style={{
                            flex: '0 0 40%', order: idx % 2 === 0 ? 1 : 0,
                            borderLeft: idx % 2 === 0 ? '0.5px solid rgba(110,90,60,0.22)' : 'none',
                            borderRight: idx % 2 === 1 ? '0.5px solid rgba(110,90,60,0.22)' : 'none',
                            background: '#FDFAF4', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '52px' }}>
                                <div style={{ fontSize: '10px', letterSpacing: '3px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '20px' }}>
                                    No. {String(idx + 1).padStart(3, '0')}
                                </div>
                                <div style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '5px', padding: '3px 10px', fontSize: '10px', marginBottom: '14px' }}>{work.genre}</div>
                                <h2 style={{ fontFamily: 'serif', fontSize: '30px', fontWeight: 400, color: '#26211C', lineHeight: 1.3, letterSpacing: '-0.5px', marginBottom: '16px' }}>{work.title}</h2>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                    <a href={`/profile/${work.profiles?.nickname}`} style={{ textDecoration: 'none' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500, color: '#C17B3F', overflow: 'hidden', cursor: 'pointer' }}>
                                            {work.profiles?.avatar_url
                                                ? <img src={work.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : work.profiles?.nickname?.[0]
                                            }
                                        </div>
                                    </a>
                                    <a href={`/profile/${work.profiles?.nickname}`} style={{ textDecoration: 'none' }}>
                                        <span style={{ fontSize: '13px', color: '#78706A' }}>{work.profiles?.nickname}</span>
                                    </a>
                                </div>

                                <div style={{ width: '28px', height: '1px', background: '#EDD9BC', marginBottom: '22px' }}></div>

                                {work.tags && work.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                                        {work.tags.map(tag => (
                                            <span key={tag} style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '20px', padding: '3px 10px', fontSize: '11px' }}>#{tag}</span>
                                        ))}
                                    </div>
                                )}

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
                                <div style={{ marginBottom: '28px' }}>
                                    <span style={{ background: '#EFE6D5', color: '#8A6F4A', borderRadius: '5px', padding: '3px 9px', fontSize: '10px' }}>{work.license}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleLike(work.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: likedIds.includes(work.id) ? '#FDF0E4' : 'none', border: `0.5px solid ${likedIds.includes(work.id) ? '#EDD9BC' : 'rgba(110,90,60,0.22)'}`, borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: likedIds.includes(work.id) ? '#C17B3F' : '#78706A', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {likedIds.includes(work.id) ? '♥' : '♡'} {likeCounts[work.id] || 0}
                                    </button>
                                    <button onClick={() => handleBookmark(work.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: bookmarkedIds.includes(work.id) ? '#FDF0E4' : 'none', border: `0.5px solid ${bookmarkedIds.includes(work.id) ? '#EDD9BC' : 'rgba(110,90,60,0.22)'}`, borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: bookmarkedIds.includes(work.id) ? '#C17B3F' : '#78706A', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {bookmarkedIds.includes(work.id) ? '★' : '☆'} 북마크
                                    </button>
                                    {idx === currentIndex && (
                                        <button onClick={() => setShowReviews(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: '#78706A', cursor: 'pointer', fontFamily: 'inherit' }}>
                                            ✏ 감상문
                                        </button>
                                    )}
                                </div>

                                {idx < works.length - 1 && (
                                    <div style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', opacity: 0.4 }}>
                                        <span style={{ fontSize: '9px', letterSpacing: '2px', color: '#78706A', textTransform: 'uppercase' }}>scroll</span>
                                        <div style={{ width: '14px', height: '14px', borderRight: '1.5px solid #AFA79F', borderBottom: '1.5px solid #AFA79F', transform: 'rotate(45deg)', marginTop: '-4px' }}></div>
                                    </div>
                                )}
                            </div>

                            {/* 감상문 패널 */}
                            {idx === currentIndex && (
                                <div style={{ position: 'absolute', inset: 0, background: '#FDFAF4', transform: showReviews ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)', overflowY: 'auto', zIndex: 10 }}>
                                    <div style={{ position: 'sticky', top: 0, background: '#FDFAF4', padding: '16px 24px 12px', borderBottom: '0.5px solid rgba(110,90,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 400 }}>                                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#26211C' }}>감상문</span>
                                        <button onClick={() => setShowReviews(false)} style={{ fontSize: '12px', color: '#AFA79F', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>✕ 닫기</button>
                                    </div>
                                    <ReviewSection
                                        workId={work.id}
                                        initialReviews={initialReviews}
                                        currentUserId={currentUserId}
                                        initialThankedIds={initialThankedIds}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}