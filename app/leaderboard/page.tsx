import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'

async function getLeaderboard() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/leaderboard`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function StarDisplay({ avg, count }: { avg: number | null; count: number }) {
  if (!avg) return <span className="text-gray-400 text-sm">No ratings</span>
  const full = Math.floor(avg)
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-400">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span className="text-sm text-gray-600">{avg} ({count})</span>
    </span>
  )
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch leaderboard server-side via direct Supabase queries
  const { data: completedRequests } = await supabase
    .from('pickup_requests')
    .select('listings:listing_id(user_id)')
    .eq('status', 'completed')

  const giveCounts: Record<string, number> = {}
  for (const req of completedRequests || []) {
    const listing = req.listings as any
    if (listing?.user_id) {
      giveCounts[listing.user_id] = (giveCounts[listing.user_id] || 0) + 1
    }
  }

  const topUserIds = Object.entries(giveCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([id]) => id)

  let leaderboard: any[] = []

  if (topUserIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', topUserIds)

    const { data: ratingsData } = await supabase
      .from('ratings')
      .select('ratee_id, stars')
      .in('ratee_id', topUserIds)

    const ratingsByUser: Record<string, number[]> = {}
    for (const r of ratingsData || []) {
      if (!ratingsByUser[r.ratee_id]) ratingsByUser[r.ratee_id] = []
      ratingsByUser[r.ratee_id].push(r.stars)
    }

    const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]))

    leaderboard = topUserIds.map((userId, index) => {
      const stars = ratingsByUser[userId] || []
      const avg = stars.length ? Math.round((stars.reduce((a, b) => a + b, 0) / stars.length) * 10) / 10 : null
      const u = userMap[userId] || {}
      return {
        rank: index + 1,
        user_id: userId,
        display_name: u.display_name || u.email?.split('@')[0] || 'Anonymous',
        pickups_given: giveCounts[userId],
        avg_rating: avg,
        rating_count: stars.length,
      }
    })
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50">
      <Nav initialUser={user} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-500">Neighbors who've shared the most fruit this season</p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow">
            <div className="text-6xl mb-4">🌳</div>
            <p className="text-gray-600">No completed pickups yet.</p>
            <p className="text-sm text-gray-400 mt-2">Be the first to share fruit and top the board!</p>
            <Link href="/listings/new" className="inline-block mt-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Share Fruit
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <Link
                key={entry.user_id}
                href={`/profile/${entry.user_id}`}
                className="flex items-center gap-4 bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow"
              >
                <div className="text-2xl w-10 text-center">
                  {entry.rank <= 3 ? medals[entry.rank - 1] : <span className="text-gray-400 font-bold">#{entry.rank}</span>}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{entry.display_name}</p>
                  <StarDisplay avg={entry.avg_rating} count={entry.rating_count} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{entry.pickups_given}</p>
                  <p className="text-xs text-gray-500">pickups given</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
