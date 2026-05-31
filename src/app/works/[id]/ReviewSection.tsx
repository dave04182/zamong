'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Review = {
  id: string
  content: string
  thanks_count: number
  created_at: string
  profiles: { nickname: string; avatar_url: string | null } | null
}

export default function ReviewSection({
  workId,
  initialReviews,
  currentUserId,
  initialThankedIds = [],
}: {
  workId: string
  initialReviews: Review[]
  currentUserId: string | null
  initialThankedIds?: string[]
}) {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [thankedIds, setThankedIds] = useState<string[]>(initialThankedIds)

  const charCount = content.length
  const isValid = charCount >= 100

  async function handleSubmit() {
    if (!currentUserId) { setMessage('로그인이 필요해요.'); return }
    if (!isValid) { setMessage('100자 이상 작성해주세요.'); return }
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('reviews')
      .insert({ work_id: workId, user_id: currentUserId, content })
      .select('*, profiles(nickname, avatar_url)')
      .single()

    if (error) {
      setMessage('등록 실패: ' + error.message)
    } else {
      setReviews(prev => [data, ...prev])
      setContent('')
    }
    setLoading(false)
  }

  async function handleThanks(reviewId: string) {
    if (!currentUserId) return
    const already = thankedIds.includes(reviewId)

    if (already) {
      await supabase.from('review_thanks').delete()
        .eq('user_id', currentUserId).eq('review_id', reviewId)
      setThankedIds(prev => prev.filter(id => id !== reviewId))
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, thanks_count: Math.max(0, r.thanks_count - 1) } : r
      ))
    } else {
      await supabase.from('review_thanks').insert({ user_id: currentUserId, review_id: reviewId })
      setThankedIds(prev => [...prev, reviewId])
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, thanks_count: r.thanks_count + 1 } : r
      ))
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {currentUserId ? (
        <div style={{ background: '#F7F3EA', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', color: '#AFA79F', lineHeight: 1.7, marginBottom: '10px', fontStyle: 'italic', borderLeft: '2px solid #EDD9BC', paddingLeft: '9px' }}>
            이 공간은 작품에 대한 진솔한 감상을 나누는 곳입니다. 작가에게 닿을 수 있는 글을 써주세요.
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="100자 이상의 감상문을 남겨주세요..."
            style={{ width: '100%', background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#26211C', fontFamily: 'inherit', resize: 'none', minHeight: '80px', outline: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: isValid ? '#C17B3F' : '#AFA79F' }}>
              {charCount} / 100자
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading || !isValid}
              style={{ fontSize: '12px', color: '#FFFCF7', background: isValid ? '#26211C' : '#AFA79F', border: 'none', borderRadius: '7px', padding: '7px 16px', cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
          {message && <p style={{ fontSize: '12px', color: '#C17B3F', marginTop: '8px' }}>{message}</p>}
        </div>
      ) : (
        <div style={{ background: '#F7F3EA', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', fontSize: '13px', color: '#AFA79F', textAlign: 'center' }}>
          <a href="/auth" style={{ color: '#C17B3F', textDecoration: 'none' }}>로그인</a>하고 감상문을 남겨보세요.
        </div>
      )}

      {reviews.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#AFA79F', textAlign: 'center', padding: '24px 0' }}>아직 감상문이 없어요. 첫 감상문을 남겨보세요.</p>
      ) : (
        <div>
          {reviews.map(review => (
            <div key={review.id} style={{ borderTop: '0.5px solid rgba(110,90,60,0.12)', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <a href={`/profile/${review.profiles?.nickname}`} style={{ textDecoration: 'none' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, color: '#C17B3F', overflow: 'hidden', flexShrink: 0 }}>
                    {review.profiles?.avatar_url
                      ? <img src={review.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : review.profiles?.nickname?.[0]
                    }
                  </div>
                </a>
                <a href={`/profile/${review.profiles?.nickname}`} style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#26211C' }}>{review.profiles?.nickname}</span>
                </a>
                <span style={{ fontSize: '11px', color: '#AFA79F', marginLeft: 'auto' }}>
                  {new Date(review.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#26211C', lineHeight: 1.8, fontWeight: 300, marginBottom: '8px' }}>{review.content}</p>
              <button
                onClick={() => handleThanks(review.id)}
                style={{
                  fontSize: '11px',
                  color: thankedIds.includes(review.id) ? '#C17B3F' : '#AFA79F',
                  background: 'none', border: 'none', cursor: currentUserId ? 'pointer' : 'default',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px'
                }}
              >
                {thankedIds.includes(review.id) ? '🧡' : '🤍'} 고마워요 {review.thanks_count}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}