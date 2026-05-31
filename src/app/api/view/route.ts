import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { workId, userId, ownerId } = await request.json()

  // 본인 작품이면 카운트 안 함
  if (userId === ownerId) {
    return NextResponse.json({ ok: false })
  }

  const cookieStore = cookies()
  const viewKey = `viewed_${workId}`
  const alreadyViewed = cookieStore.get(viewKey)

  if (alreadyViewed) {
    return NextResponse.json({ ok: false })
  }

  const supabase = await createClient()
  const { data: work } = await supabase
    .from('works')
    .select('view_count')
    .eq('id', workId)
    .single()

  await supabase
    .from('works')
    .update({ view_count: (work?.view_count || 0) + 1 })
    .eq('id', workId)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(viewKey, '1', {
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}