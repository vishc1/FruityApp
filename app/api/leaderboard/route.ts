import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/leaderboard — top fruit sharers
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Count completed pickup requests where the user is the listing owner (giver)
  const { data: completedRequests, error } = await supabase
    .from('pickup_requests')
    .select(`
      requester_id,
      listings:listing_id (user_id)
    `)
    .eq('status', 'completed')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Tally pickups given per user
  const giveCounts: Record<string, number> = {}
  for (const req of completedRequests || []) {
    const listing = req.listings as any
    if (listing?.user_id) {
      giveCounts[listing.user_id] = (giveCounts[listing.user_id] || 0) + 1
    }
  }

  if (Object.keys(giveCounts).length === 0) {
    return NextResponse.json([])
  }

  // Fetch avg ratings and user info for top users
  const topUserIds = Object.entries(giveCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([id]) => id)

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

  const leaderboard = topUserIds.map((userId, index) => {
    const stars = ratingsByUser[userId] || []
    const avg = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : null
    const u = userMap[userId] || {}
    return {
      rank: index + 1,
      user_id: userId,
      display_name: u.display_name || u.email?.split('@')[0] || 'Anonymous',
      pickups_given: giveCounts[userId],
      avg_rating: avg ? Math.round(avg * 10) / 10 : null,
      rating_count: stars.length,
    }
  })

  return NextResponse.json(leaderboard)
}
