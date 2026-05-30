'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  async function handleSignup() {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
    if (error) setMessage(error.message)
    else setMessage('인증 메일을 보냈어요. 이메일을 확인해주세요!')
    setLoading(false)
  }

  async function handleLogin() {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else window.location.href = '/'
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#FDFAF4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.22)',
        borderRadius: '16px', padding: '40px', width: '380px'
      }}>
        <h1 style={{ fontFamily: 'serif', fontSize: '22px', marginBottom: '6px', color: '#26211C' }}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#78706A', marginBottom: '28px' }}>
          {mode === 'login' ? '로그인하고 전시를 감상하세요' : '이메일로 간편하게 가입하세요'}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
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
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        {message && (
          <p style={{ fontSize: '12px', color: '#C17B3F', marginTop: '12px' }}>{message}</p>
        )}

        <button
          onClick={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}
          style={{
            width: '100%', marginTop: '20px', padding: '11px',
            background: '#26211C', color: '#FFFCF7', border: 'none',
            borderRadius: '9px', fontSize: '13px', cursor: 'pointer',
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