import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AdminExhibitionForm from '../ExhibitionForm'

export default async function EditExhibitionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const { data: exhibition } = await supabase
    .from('exhibitions').select('*').eq('id', params.id).single()
  if (!exhibition) notFound()

  const { data: ew } = await supabase
    .from('exhibition_works')
    .select('*, works(*, profiles(nickname))')
    .eq('exhibition_id', params.id)
    .order('sort_order', { ascending: true })

  const existingWorks = ew?.map((e: any) => e.works).filter(Boolean) || []

  return <AdminExhibitionForm exhibition={exhibition} existingWorks={existingWorks} />
}