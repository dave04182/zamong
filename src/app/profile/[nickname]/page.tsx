import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DeleteWorkButton from './DeleteWorkButton'

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { nickname: string }
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()
  const nickname = decodeURIComponent(params.nickname)
  const tab = searchParams.tab || 'works'

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('nickname', nickname)
    .single()

  if (!profile) notFound()

  const isMe = user?.id === profile.id

  const { data: works } = await supabase
    .from('works')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_ai', false)
    .order('created_at', { ascending: false })

  const totalViews = works?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0
  const totalLikes = works?.reduce((sum, w) => sum + (w.like_count || 0), 0) || 0

  // 북마크한 작품 (본인만)
  const { data: bookmarkData } = isMe ? await supabase
    .from('bookmarks')
    .select('work_id, works(*)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false }) : { data: [] }

  // 좋아요한 작품 (본인만)
  const { data: likeData } = isMe ? await supabase
    .from('likes')
    .select('work_id, works(*)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false }) : { data: [] }

  // 내가 쓴 감상문 (본인만)
  const { data: reviewData } = isMe ? await supabase
    .from('reviews')
    .select('*, works(title, genre, thumbnail_url)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false }) : { data: [] }

  const tabs = isMe
    ? [
      { id: 'works', label: '작품' },
      { id: 'likes', label: '좋아요' },
      { id: 'bookmarks', label: '북마크' },
      { id: 'reviews', label: '감상문' },
    ]
    : [{ id: 'works', label: '작품' }]

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF4', fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: 'rgba(253,250,244,0.88)', backdropFilter: 'blur(14px)', borderBottom: '0.5px solid rgba(110,90,60,0.22)', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'serif', fontSize: '22px', color: '#26211C', textDecoration: 'none' }}>
          자<span style={{ color: '#C17B3F' }}>몽</span>
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isMe ? (
            <>
              <Link href="/profile/edit" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>프로필 편집</Link>
              <form action="/auth/signout" method="POST">
                <button type="submit" style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', background: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>로그아웃</button>
              </form>
              <Link href="/upload" style={{ fontSize: '13px', color: '#FFFCF7', background: '#C17B3F', borderRadius: '8px', padding: '6px 16px', textDecoration: 'none' }}>작품 등록</Link>
            </>
          ) : (
            <button style={{ fontSize: '13px', color: '#78706A', border: '0.5px solid rgba(110,90,60,0.22)', background: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer' }}>+ 팔로우</button>
          )}
        </div>
      </nav>

      {/* 프로필 헤더 */}
      <div style={{ background: '#F7F3EA', borderBottom: '0.5px solid rgba(110,90,60,0.12)', padding: '48px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', maxWidth: '900px' }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: '#EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 500, color: '#C17B3F', flexShrink: 0, overflow: 'hidden' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile.nickname[0]
            }
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'serif', fontSize: '28px', fontWeight: 400, color: '#26211C', marginBottom: '6px' }}>{profile.nickname}</h1>
            {profile.main_genre && profile.main_genre.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {profile.main_genre.map((g: string) => (
                  <span key={g} style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '5px', padding: '3px 10px', fontSize: '11px' }}>{g}</span>
                ))}
              </div>
            )}
            {profile.bio && (
              <p style={{ fontSize: '14px', color: '#78706A', lineHeight: 1.75, marginBottom: '10px' }}>{profile.bio}</p>
            )}
            {profile.external_link && (
              <a href={profile.external_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#C17B3F', textDecoration: 'none' }}>
                🔗 {profile.external_link}
              </a>
            )}
          </div>
          <div style={{ display: 'flex', gap: '32px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'serif', fontSize: '24px', color: '#26211C' }}>{works?.length || 0}</div>
              <div style={{ fontSize: '11px', color: '#AFA79F', marginTop: '2px' }}>작품</div>
            </div>
            {isMe && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'serif', fontSize: '24px', color: '#26211C' }}>{totalViews}</div>
                  <div style={{ fontSize: '11px', color: '#AFA79F', marginTop: '2px' }}>조회수</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'serif', fontSize: '24px', color: '#26211C' }}>{totalLikes}</div>
                  <div style={{ fontSize: '11px', color: '#AFA79F', marginTop: '2px' }}>좋아요</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ borderBottom: '0.5px solid rgba(110,90,60,0.12)', padding: '0 64px' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {tabs.map(t => (
            <Link key={t.id} href={`/profile/${nickname}?tab=${t.id}`} style={{
              padding: '14px 20px', fontSize: '13px', textDecoration: 'none',
              color: tab === t.id ? '#26211C' : '#AFA79F',
              borderBottom: tab === t.id ? '2px solid #26211C' : '2px solid transparent',
              fontWeight: tab === t.id ? 500 : 400,
              transition: 'all 0.2s',
            }}>{t.label}</Link>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ padding: '32px 64px' }}>

        {/* 작품 탭 */}
        {tab === 'works' && (
          works && works.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {works.map(work => (
                <div key={work.id} style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                  <Link href={`/works/${work.id}?from=profile&userId=${profile.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ height: '160px', background: '#F0EBE0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {work.thumbnail_url
                        ? <img src={work.thumbnail_url} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ textAlign: 'center', padding: '20px' }}>
                          <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '8px' }}>{work.genre}</div>
                          <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#26211C', lineHeight: 1.5 }}>{work.title}</div>
                        </div>
                      }
                    </div>
                    <div style={{ padding: '10px 12px 8px' }}>
                      <div style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', marginBottom: '5px' }}>{work.genre}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#26211C', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{work.title}</div>
                      {isMe && <div style={{ fontSize: '11px', color: '#AFA79F' }}>조회 {work.view_count || 0} · 좋아요 {work.like_count || 0}</div>}
                    </div>
                  </Link>
                  {isMe && (
                    <div style={{ padding: '0 12px 12px' }}>
                      <DeleteWorkButton workId={work.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#AFA79F', fontSize: '14px' }}>아직 등록한 작품이 없어요.</div>
          )
        )}

        {/* 좋아요 탭 */}
        {tab === 'likes' && isMe && (
          likeData && likeData.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {likeData.map((item: any) => (
                <Link key={item.work_id} href={`/works/${item.work_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ height: '160px', background: '#F0EBE0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.works?.thumbnail_url
                        ? <img src={item.works.thumbnail_url} alt={item.works.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ textAlign: 'center', padding: '20px' }}>
                          <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '8px' }}>{item.works?.genre}</div>
                          <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#26211C', lineHeight: 1.5 }}>{item.works?.title}</div>
                        </div>
                      }
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', marginBottom: '5px' }}>{item.works?.genre}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#26211C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.works?.title}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#AFA79F', fontSize: '14px' }}>좋아요한 작품이 없어요.</div>
          )
        )}

        {/* 북마크 탭 */}
        {tab === 'bookmarks' && isMe && (
          bookmarkData && bookmarkData.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {bookmarkData.map((item: any) => (
                <Link key={item.work_id} href={`/works/${item.work_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ height: '160px', background: '#F0EBE0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.works?.thumbnail_url
                        ? <img src={item.works.thumbnail_url} alt={item.works.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ textAlign: 'center', padding: '20px' }}>
                          <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#AFA79F', textTransform: 'uppercase', marginBottom: '8px' }}>{item.works?.genre}</div>
                          <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#26211C', lineHeight: 1.5 }}>{item.works?.title}</div>
                        </div>
                      }
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', marginBottom: '5px' }}>{item.works?.genre}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#26211C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.works?.title}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#AFA79F', fontSize: '14px' }}>북마크한 작품이 없어요.</div>
          )
        )}

        {/* 감상문 탭 */}
        {tab === 'reviews' && isMe && (
          reviewData && reviewData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px' }}>
              {reviewData.map((review: any) => (
                <Link key={review.id} href={`/works/${review.work_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#FFFCF7', border: '0.5px solid rgba(110,90,60,0.12)', borderRadius: '12px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ display: 'inline-block', background: '#EFE6D5', color: '#8A6F4A', borderRadius: '4px', padding: '2px 7px', fontSize: '10px' }}>{review.works?.genre}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#26211C' }}>{review.works?.title}</span>
                      <span style={{ fontSize: '11px', color: '#AFA79F', marginLeft: 'auto' }}>
                        {new Date(review.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#78706A', lineHeight: 1.8, fontWeight: 300 }}>{review.content}</p>
                    <div style={{ fontSize: '11px', color: '#AFA79F', marginTop: '8px' }}>🤍 고마워요 {review.thanks_count}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#AFA79F', fontSize: '14px' }}>아직 작성한 감상문이 없어요.</div>
          )
        )}
      </div>
    </div>
  )
}