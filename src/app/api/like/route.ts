import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { workId, action } = await request.json()
  // action: 'like' | 'unlike'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 본인 작품 좋아요 불가
  const { data: work } = await supabase
    .from('works')
    .select('user_id, like_count')
    .eq('id', workId)
    .single()

  if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (work.user_id === user.id) return NextResponse.json({ error: 'Cannot like own work' }, { status: 400 })

  if (action === 'like') {
    // likes 테이블에 추가
    const { error: likeError } = await supabase
      .from('likes')
      .insert({ user_id: user.id, work_id: workId })

    if (likeError) return NextResponse.json({ error: likeError.message }, { status: 400 })

    // like_count 증가 — 서버에서 직접 처리
    const { data } = await supabase.rpc('increment_like_count', { work_id: workId })

  } else {
    // likes 테이블에서 삭제
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('work_id', workId)

    // like_count 감소
    await supabase.rpc('decrement_like_count', { work_id: workId })
  }

  // 최신 like_count 반환
  const { data: updated } = await supabase
    .from('works')
    .select('like_count')
    .eq('id', workId)
    .single()

  return NextResponse.json({ like_count: updated?.like_count || 0 })
}