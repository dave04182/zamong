import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ExhibitionViewer from '../../../components/ExhibitionViewer'

export default async function ExhibitionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase
    .from('profiles').select('nickname, is_admin').eq('id', user.id).single() : { data: null }

  const { data: exhibition } = await supabase
    .from('exhibitions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!exhibition) notFound()

  const { data: exhibitionWorks } = await supabase
    .from('exhibition_works')
    .select('*, works(*, profiles(nickname, bio, avatar_url))')
    .eq('exhibition_id', params.id)
    .order('sort_order', { ascending: true })

  const works = exhibitionWorks?.map((ew: any) => ew.works).filter(Boolean) || []

  const { data: likedWorks } = user ? await supabase
    .from('likes').select('work_id').eq('user_id', user.id) : { data: [] }
  const { data: bookmarkedWorks } = user ? await supabase
    .from('bookmarks').select('work_id').eq('user_id', user.id) : { data: [] }
  const { data: thankedReviews } = user ? await supabase
    .from('review_thanks').select('review_id').eq('user_id', user.id) : { data: [] }

  const likedIds = likedWorks?.map((l: any) => l.work_id) || []
  const bookmarkedIds = bookmarkedWorks?.map((b: any) => b.work_id) || []
  const thankedIds = thankedReviews?.map((t: any) => t.review_id) || []

  const firstWork = works[0]
  const { data: reviews } = firstWork ? await supabase
    .from('reviews')
    .select('*, profiles(nickname, avatar_url)')
    .eq('work_id', firstWork.id)
    .order('created_at', { ascending: false }) : { data: [] }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", height: '100vh', overflow: 'hidden' }}>


      <ExhibitionViewer
        exhibition={exhibition}
        works={works}
        initialReviews={reviews || []}
        currentUserId={user?.id || null}
        initialThankedIds={thankedIds}
        initialLikedIds={likedIds}
        initialBookmarkedIds={bookmarkedIds}
        isAdmin={profile?.is_admin || false}
        exhibitionId={params.id}
      />
    </div>
  )
}