'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminExhibitionForm({
    exhibition,
    existingWorks = [],
}: {
    exhibition?: any
    existingWorks?: any[]
}) {
    const supabase = createClient()
    const router = useRouter()
    const isEdit = !!exhibition

    const [title, setTitle] = useState(exhibition?.title || '')
    const [description, setDescription] = useState(exhibition?.description || '')
    const [curatorNote, setCuratorNote] = useState(exhibition?.curator_note || '')
    const [isActive, setIsActive] = useState(exhibition?.is_active ?? true)
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [thumbnailPreview, setThumbnailPreview] = useState(exhibition?.thumbnail_url || '')
    const [works, setWorks] = useState<any[]>(existingWorks)
    const [searchQ, setSearchQ] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    async function handleSearch() {
        if (!searchQ.trim()) return

        // 작가 닉네임으로 user_id 먼저 찾기
        const { data: matchedProfiles } = await supabase
            .from('profiles')
            .select('id')
            .ilike('nickname', `%${searchQ}%`)

        const profileIds = matchedProfiles?.map(p => p.id) || []

        let query = supabase
            .from('works')
            .select('*, profiles(nickname)')
            .eq('is_ai', false)
            .limit(10)

        if (profileIds.length > 0) {
            query = query.or(`title.ilike.%${searchQ}%,tags.cs.{"${searchQ}"},user_id.in.(${profileIds.join(',')})`)
        } else {
            query = query.or(`title.ilike.%${searchQ}%,tags.cs.{"${searchQ}"}`)
        }

        const { data } = await query
        setSearchResults(data || [])
    }

    function addWork(work: any) {
        if (works.find(w => w.id === work.id)) return
        setWorks(prev => [...prev, work])
        setSearchResults([])
        setSearchQ('')
    }

    function removeWork(workId: string) {
        setWorks(prev => prev.filter(w => w.id !== workId))
    }

    function moveWork(idx: number, dir: 'up' | 'down') {
        const newWorks = [...works]
        const target = dir === 'up' ? idx - 1 : idx + 1
        if (target < 0 || target >= newWorks.length) return;
        [newWorks[idx], newWorks[target]] = [newWorks[target], newWorks[idx]]
        setWorks(newWorks)
    }

    async function handleSubmit() {
        if (!title.trim()) { setMessage('제목은 필수예요.'); return }
        setLoading(true)
        setMessage('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth'); return }

        let thumbnailUrl = thumbnailPreview
        if (thumbnailFile) {
            const ext = thumbnailFile.name.split('.').pop()
            const path = `exhibitions/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage.from('works').upload(path, thumbnailFile)
            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('works').getPublicUrl(path)
                thumbnailUrl = urlData.publicUrl
            }
        }

        let exhibitionId = exhibition?.id

        if (isEdit) {
            await supabase.from('exhibitions').update({
                title, description, curator_note: curatorNote,
                is_active: isActive, thumbnail_url: thumbnailUrl
            }).eq('id', exhibitionId)
            await supabase.from('exhibition_works').delete().eq('exhibition_id', exhibitionId)
        } else {
            const { data } = await supabase.from('exhibitions').insert({
                title, description, curator_note: curatorNote,
                is_active: isActive, thumbnail_url: thumbnailUrl
            }).select().single()
            exhibitionId = data?.id
        }

        if (works.length > 0) {
            await supabase.from('exhibition_works').insert(
                works.map((w, i) => ({ exhibition_id: exhibitionId, work_id: w.id, sort_order: i + 1 }))
            )
        }

        router.push('/exhibitions')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ background: '#FFFCF7', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
                <span style={{ fontFamily: 'serif', fontSize: '20px', color: '#26211C', cursor: 'pointer' }} onClick={() => router.push('/exhibitions')}>
                    자<span style={{ color: '#C17B3F' }}>몽</span>
                </span>
                <span style={{ fontSize: '14px', color: '#78706A' }}>{isEdit ? '기획전 편집' : '기획전 만들기'}</span>
            </div>

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ fontFamily: 'serif', fontSize: '26px', fontWeight: 400, color: '#26211C', marginBottom: '40px' }}>
                    {isEdit ? '기획전 편집' : '새 기획전'}
                </h1>

                {/* 제목 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>기획전 제목 *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 봄을 그린 작가들" style={inputStyle} />
                </div>

                {/* 설명 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>한 줄 설명</label>
                    <input value={description} onChange={e => setDescription(e.target.value)} placeholder="기획전을 짧게 소개해주세요" style={inputStyle} />
                </div>

                {/* 큐레이터 노트 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>큐레이터 노트</label>
                    <textarea value={curatorNote} onChange={e => setCuratorNote(e.target.value)}
                        placeholder="기획전의 의도와 배경을 자유롭게 써주세요"
                        style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
                </div>

                {/* 썸네일 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>대표 이미지 (선택)</label>
                    {thumbnailPreview && (
                        <img src={thumbnailPreview} alt="preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }} />
                    )}
                    <label style={{ display: 'block', border: '0.5px dashed rgba(110,90,60,0.35)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', color: '#AFA79F', fontSize: '13px' }}>
                        {thumbnailPreview ? '이미지 변경' : '클릭하여 이미지 업로드'}
                        <input type="file" accept="image/*" onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)) }
                        }} style={{ display: 'none' }} />
                    </label>
                </div>

                {/* 작품 추가 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>작품 추가</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="제목으로 작품 검색"
                            style={{ ...inputStyle, flex: 1 }}
                        />
                        <button onClick={handleSearch} style={{ padding: '10px 18px', background: '#26211C', color: '#FFFCF7', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>검색</button>
                    </div>

                    {searchResults.length > 0 && (
                        <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
                            {searchResults.map(work => (
                                <div key={work.id} onClick={() => addWork(work)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid rgba(110,90,60,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#F0EBE0', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                                        {work.thumbnail_url && <img src={work.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', color: '#26211C', fontWeight: 500 }}>{work.title}</div>
                                        <div style={{ fontSize: '11px', color: '#AFA79F' }}>{work.profiles?.nickname} · {work.genre}</div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#C17B3F' }}>+ 추가</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {works.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {works.map((work, idx) => (
                                <div key={work.id} style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#AFA79F', flexShrink: 0 }}>{idx + 1}</span>
                                    <div style={{ width: '36px', height: '36px', background: '#F0EBE0', borderRadius: '5px', overflow: 'hidden', flexShrink: 0 }}>
                                        {work.thumbnail_url && <img src={work.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', color: '#26211C', fontWeight: 500 }}>{work.title}</div>
                                        <div style={{ fontSize: '11px', color: '#AFA79F' }}>{work.profiles?.nickname} · {work.genre}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={() => moveWork(idx, 'up')} disabled={idx === 0} style={{ fontSize: '12px', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '5px', padding: '3px 7px', cursor: 'pointer', color: '#78706A' }}>↑</button>
                                        <button onClick={() => moveWork(idx, 'down')} disabled={idx === works.length - 1} style={{ fontSize: '12px', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '5px', padding: '3px 7px', cursor: 'pointer', color: '#78706A' }}>↓</button>
                                        <button onClick={() => removeWork(work.id)} style={{ fontSize: '12px', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '5px', padding: '3px 7px', cursor: 'pointer', color: '#C17B3F' }}>✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 공개 여부 */}
                <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label htmlFor="isActive" style={{ fontSize: '13px', color: '#78706A', cursor: 'pointer' }}>공개</label>
                </div>

                {message && <p style={{ fontSize: '13px', color: '#C17B3F', marginBottom: '16px' }}>{message}</p>}

                <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '13px', background: '#26211C', color: '#FFFCF7', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                    {loading ? '저장 중...' : isEdit ? '수정하기' : '기획전 만들기'}
                </button>
            </div>
        </div>
    )
}

const fieldStyle: React.CSSProperties = { marginBottom: '28px' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#26211C', marginBottom: '10px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', fontSize: '13px', color: '#26211C', outline: 'none', fontFamily: 'inherit' }