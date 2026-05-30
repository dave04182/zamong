'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const GENRES = ['그림', '사진', '디자인', '단편소설', '시', '수필', '각본', '영상', '현대미술', '기타']
const LICENSES = ['감상만 허용', '공유 허용', '저장 허용', 'CC BY', 'CC BY-NC']

export default function UploadPage() {
    const router = useRouter()
    const supabase = createClient()

    const [title, setTitle] = useState('')
    const [genre, setGenre] = useState('')
    const [description, setDescription] = useState('')
    const [authorNote, setAuthorNote] = useState('')
    const [license, setLicense] = useState('감상만 허용')
    const [isAi, setIsAi] = useState(false)
    const [contentText, setContentText] = useState('')
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [thumbnailPreview, setThumbnailPreview] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const isTextGenre = ['단편소설', '시', '수필', '각본'].includes(genre)

    function handleThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setThumbnailFile(file)
        setThumbnailPreview(URL.createObjectURL(file))
    }

    async function handleSubmit() {
        if (!title || !genre) { setMessage('제목과 장르는 필수예요.'); return }
        setLoading(true)
        setMessage('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth'); return }

        let thumbnailUrl = ''

        // 썸네일 업로드
        if (thumbnailFile) {
            const ext = thumbnailFile.name.split('.').pop()
            const path = `${user.id}/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from('works')
                .upload(path, thumbnailFile)
            if (uploadError) { setMessage('이미지 업로드 실패: ' + uploadError.message); setLoading(false); return }
            const { data: urlData } = supabase.storage.from('works').getPublicUrl(path)
            thumbnailUrl = urlData.publicUrl
        }

        // 작품 DB 저장
        const { error } = await supabase.from('works').insert({
            user_id: user.id,
            title,
            genre,
            description,
            author_note: authorNote,
            license,
            is_ai: isAi,
            thumbnail_url: thumbnailUrl,
            content_text: isTextGenre ? contentText : null,
        })

        if (error) { setMessage('등록 실패: ' + error.message); setLoading(false); return }

        router.push('/')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
            {/* 헤더 */}
            <div style={{ background: '#FFFCF7', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
                <span style={{ fontFamily: 'serif', fontSize: '20px', color: '#26211C', cursor: 'pointer' }} onClick={() => router.push('/')}>
                    자<span style={{ color: '#C17B3F' }}>몽</span>
                </span>
                <span style={{ fontSize: '14px', color: '#78706A' }}>작품 등록</span>
            </div>

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ fontFamily: 'serif', fontSize: '26px', fontWeight: 400, color: '#26211C', marginBottom: '8px' }}>작품 등록</h1>
                <p style={{ fontSize: '13px', color: '#AFA79F', marginBottom: '40px' }}>창작물을 전시하고 감상자들과 만나보세요.</p>

                {/* 장르 선택 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>장르 <span style={{ color: '#C17B3F' }}>*</span></label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {GENRES.map(g => (
                            <button key={g} onClick={() => setGenre(g)} style={{
                                padding: '7px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                                background: genre === g ? '#26211C' : '#FFFCF7',
                                color: genre === g ? '#FFFCF7' : '#78706A',
                                border: '0.5px solid rgba(110,90,60,0.22)',
                                transition: 'all 0.2s',
                            }}>{g}</button>
                        ))}
                    </div>
                </div>

                {/* 제목 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>제목 <span style={{ color: '#C17B3F' }}>*</span></label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="작품 제목을 입력하세요" style={inputStyle} />
                </div>

                {/* 텍스트 작품 본문 */}
                {isTextGenre && (
                    <div style={fieldStyle}>
                        <label style={labelStyle}>본문</label>
                        <textarea value={contentText} onChange={e => setContentText(e.target.value)}
                            placeholder={genre === '시' ? '시를 입력하세요' : '본문을 입력하세요'}
                            style={{ ...inputStyle, minHeight: '200px', resize: 'vertical' }} />
                    </div>
                )}

                {/* 썸네일 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>{isTextGenre ? '대표 이미지 (선택)' : '작품 이미지'}</label>
                    {thumbnailPreview && (
                        genre === '영상'
                            ? <video src={thumbnailPreview} controls style={{ width: '100%', maxHeight: '300px', borderRadius: '10px', marginBottom: '10px' }} />
                            : <img src={thumbnailPreview} alt="preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }} />
                    )}
                    <label style={{ display: 'block', border: '0.5px dashed rgba(110,90,60,0.35)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', color: '#AFA79F', fontSize: '13px' }}>
                        {thumbnailPreview ? '파일 변경' : genre === '영상' ? '클릭하여 영상 업로드 (mp4, mov)' : '클릭하여 이미지 업로드'}
                        <input
                            type="file"
                            accept={genre === '영상' ? 'video/mp4,video/mov,video/quicktime' : 'image/*'}
                            onChange={handleThumbnail}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                {/* 작품 설명 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>작품 설명</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="작품에 대한 설명을 써주세요"
                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
                </div>

                {/* 작가 노트 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>작가 노트 <span style={{ fontSize: '11px', color: '#AFA79F' }}>(선택)</span></label>
                    <textarea value={authorNote} onChange={e => setAuthorNote(e.target.value)}
                        placeholder="창작 의도나 과정을 자유롭게 적어주세요"
                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
                </div>

                {/* 저작권 */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>저작권 설정</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {LICENSES.map(l => (
                            <button key={l} onClick={() => setLicense(l)} style={{
                                padding: '7px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                                background: license === l ? '#26211C' : '#FFFCF7',
                                color: license === l ? '#FFFCF7' : '#78706A',
                                border: '0.5px solid rgba(110,90,60,0.22)',
                            }}>{l}</button>
                        ))}
                    </div>
                </div>

                {/* AI 여부 */}
                <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="isAi" checked={isAi} onChange={e => setIsAi(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label htmlFor="isAi" style={{ fontSize: '13px', color: '#78706A', cursor: 'pointer' }}>
                        AI 창작물입니다 (AI 창작관에 등록됩니다)
                    </label>
                </div>

                {message && <p style={{ fontSize: '13px', color: '#C17B3F', marginBottom: '16px' }}>{message}</p>}

                <button onClick={handleSubmit} disabled={loading} style={{
                    width: '100%', padding: '13px', background: '#26211C', color: '#FFFCF7',
                    border: 'none', borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
                }}>
                    {loading ? '등록 중...' : '전시 등록하기'}
                </button>
            </div>
        </div>
    )
}

const fieldStyle: React.CSSProperties = { marginBottom: '28px' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#26211C', marginBottom: '10px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', fontSize: '13px', color: '#26211C', outline: 'none', fontFamily: 'inherit' }