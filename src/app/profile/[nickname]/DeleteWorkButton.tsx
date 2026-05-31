'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DeleteWorkButton({ workId }: { workId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    await supabase.from('works').delete().eq('id', workId)
    router.refresh()
    setLoading(false)
    setConfirm(false)
  }

  if (confirm) {
    return (
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{ fontSize: '11px', color: '#FFFCF7', background: '#C17B3F', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {loading ? '삭제 중...' : '삭제 확인'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          style={{ fontSize: '11px', color: '#78706A', background: 'none', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      style={{ fontSize: '11px', color: '#AFA79F', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px', padding: 0 }}
    >
      삭제
    </button>
  )
}