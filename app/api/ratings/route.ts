import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/ratings?user_id=xxx — aggregate rating + recent reviews for a user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ratings')
    .select('stars, review, created_at, rater_id, users:rater_id(display_name, email)')
    .eq('ratee_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const stars = (data || []).map((r: any) => r.stars)
  const avg = stars.length ? stars.reduce((a: number, b: number) => a + b, 0) / stars.length : null

  return NextResponse.json({ avg_rating: avg, rating_count: stars.length, reviews: data })
}

// POST /api/ratings — submit a rating after a completed pickup
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { pickup_request_id, ratee_id, stars, review } = body

    if (!pickup_request_id || !ratee_id || !stars) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Stars must be 1–5' }, { status: 400 })
    }

    // Verify the request is completed and the rater was involved
    const { data: req } = await supabase
      .from('pickup_requests')
      .select('id, requester_id, status, listings:listing_id(user_id)')
      .eq('id', pickup_request_id)
      .single()

    if (!req || req.status !== 'completed') {
      return NextResponse.json({ error: 'Can only rate completed pickups' }, { status: 400 })
    }

    const listing = req.listings as any
    const isInvolved = req.requester_id === user.id || listing?.user_id === user.id
    if (!isInvolved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('ratings')
      .insert({ pickup_request_id, rater_id: user.id, ratee_id, stars, review })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You have already rated this pickup' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
