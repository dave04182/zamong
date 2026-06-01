'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const GENRES = ['그림', '사진', '디자인', '단편소설', '시', '수필', '각본', '영상', '현대미술', '기타']

export default function EditProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [mainGenre, setMainGenre] = useState<string[]>([])
  const [externalLink, setExternalLink] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setNickname(profile.nickname || '')
        setBio(profile.bio || '')
        setMainGenre(profile.main_genre || [])
        setExternalLink(profile.external_link || '')
        setAvatarPreview(profile.avatar_url || '')
        setIsPublic(profile.is_public ?? true)
      }
    }
    loadProfile()
  }, [])

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function toggleGenre(g: string) {
    setMainGenre(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  async function handleSave() {
    if (!nickname.trim()) { setMessage('닉네임은 필수예요.'); return }
    setLoading(true)
    setMessage('')

    let avatarUrl = avatarPreview

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (uploadError) { setMessage('이미지 업로드 실패: ' + uploadError.message); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = urlData.publicUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        nickname,
        bio,
        main_genre: mainGenre,
        external_link: externalLink,
        avatar_url: avatarUrl,
        is_public: isPublic,
      })
      .eq('id', userId)

    if (error) {
      setMessage('저장 실패: ' + error.message)
    } else {
      router.push(`/profile/${nickname}`)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: '#FFFCF7', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: 'serif', fontSize: '20px', color: '#26211C', cursor: 'pointer' }} onClick={() => router.back()}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </span>
        <span style={{ fontSize: '14px', color: '#78706A' }}>프로필 편집</span>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'serif', fontSize: '26px', fontWeight: 400, color: '#26211C', marginBottom: '40px' }}>프로필 편집</h1>

        {/* 아바타 */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EDD9BC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#C17B3F', flexShrink: 0 }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : nickname[0] || '?'
            }
          </div>
          <label style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '7px 16px', cursor: 'pointer' }}>
            사진 변경
            <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
          </label>
        </div>

        {/* 닉네임 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>닉네임 *</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle} />
        </div>

        {/* 소개글 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>소개글</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="나를 소개해주세요" style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} />
        </div>

        {/* 주요 장르 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>주요 장르 <span style={{ fontSize: '11px', color: '#AFA79F', fontWeight: 400 }}>(복수 선택 가능)</span></label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {GENRES.map(g => (
              <button key={g} onClick={() => toggleGenre(g)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                background: mainGenre.includes(g) ? '#26211C' : '#FFFCF7',
                color: mainGenre.includes(g) ? '#FFFCF7' : '#78706A',
                border: '0.5px solid rgba(110,90,60,0.22)',
                transition: 'all 0.2s',
              }}>{g}</button>
            ))}
          </div>
        </div>

        {/* 외부 링크 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>외부 링크</label>
          <input value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://..." style={inputStyle} />
        </div>

        {/* 프로필 공개 여부 */}
        <div style={{ ...fieldStyle, background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '10px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#26211C', marginBottom: '3px' }}>작가 페이지 공개</div>
            <div style={{ fontSize: '12px', color: '#AFA79F' }}>
              {isPublic ? '작가 목록에 프로필이 공개돼요' : '작가 목록에서 숨겨져요'}
            </div>
          </div>
          <button
            onClick={() => setIsPublic(prev => !prev)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: isPublic ? '#26211C' : '#D0C8BE',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px',
              left: isPublic ? '23px' : '3px',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {message && <p style={{ fontSize: '13px', color: '#C17B3F', marginBottom: '16px' }}>{message}</p>}

        <button onClick={handleSave} disabled={loading} style={{
          width: '100%', padding: '13px', background: loading ? '#AFA79F' : '#26211C',
          color: '#FFFCF7', border: 'none', borderRadius: '10px',
          fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}

const fieldStyle: React.CSSProperties = { marginBottom: '24px' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#26211C', marginBottom: '8px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', fontSize: '13px', color: '#26211C', outline: 'none', fontFamily: 'inherit' }