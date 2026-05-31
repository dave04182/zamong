'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  async function handleSignup() {
    if (!nickname.trim()) { setMessage('닉네임을 입력해주세요.'); return }
    if (password.length < 8) { setMessage('비밀번호는 8자 이상이어야 해요.'); return }
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setIsSuccess(true)
    }
    setLoading(false)
  }

  async function handleLogin() {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setMessage('이메일 인증이 필요해요. 받은 편지함을 확인해주세요.')
      } else {
        setMessage('이메일 또는 비밀번호가 올바르지 않아요.')
      }
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  // 가입 성공 → 인증 메일 안내 화면
  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDFAF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '16px', padding: '48px 40px', width: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
          <h2 style={{ fontFamily: 'serif', fontSize: '22px', color: '#26211C', marginBottom: '12px', fontWeight: 400 }}>인증 메일을 보냈어요</h2>
          <p style={{ fontSize: '13px', color: '#78706A', lineHeight: 1.8, marginBottom: '8px' }}>
            <strong>{email}</strong> 로 인증 링크를 보냈어요.
          </p>
          <p style={{ fontSize: '13px', color: '#AFA79F', lineHeight: 1.8, marginBottom: '28px' }}>
            메일함을 확인하고 링크를 클릭하면<br />가입이 완료돼요.
          </p>
          <button
            onClick={() => { setIsSuccess(false); setMode('login') }}
            style={{ fontSize: '13px', color: '#78706A', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer' }}
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '16px', padding: '40px', width: '380px' }}>
        <h1 style={{ fontFamily: 'serif', fontSize: '22px', marginBottom: '6px', color: '#26211C' }}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#78706A', marginBottom: '28px' }}>
          {mode === 'login' ? '로그인하고 전시를 감상하세요' : '이메일로 간편하게 가입하세요'}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMessage('') }} style={{
              flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              background: mode === m ? '#26211C' : 'none',
              color: mode === m ? '#FFFCF7' : '#78706A',
              border: '0.5px solid rgba(110,90,60,0.22)',
            }}>
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mode === 'signup' && (
            <input
              placeholder="닉네임"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              style={inputStyle}
            />
          )}
          <input
            placeholder="이메일"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder={mode === 'signup' ? '비밀번호 (8자 이상)' : '비밀번호'}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            style={inputStyle}
          />
        </div>

        {message && (
          <p style={{ fontSize: '12px', color: '#C17B3F', marginTop: '12px', lineHeight: 1.6 }}>{message}</p>
        )}

        <button
          onClick={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}
          style={{
            width: '100%', marginTop: '20px', padding: '11px',
            background: loading ? '#AFA79F' : '#26211C',
            color: '#FFFCF7', border: 'none',
            borderRadius: '9px', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: '#FDFAF4', border: '0.5px solid rgba(110,90,60,0.22)',
  borderRadius: '8px', fontSize: '13px', color: '#26211C',
  outline: 'none', fontFamily: 'inherit',
}