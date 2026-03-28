import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/profile/:id — public profile data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('id, display_name, email, created_at')
    .eq('id', id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Count active listings
  const { count: listingsCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', id)
    .eq('status', 'active')

  // Check if user has a verified property
  const { data: property } = await supabase
    .from('properties')
    .select('is_verified')
    .eq('user_id', id)
    .single()

  // Count pickups given (completed requests where user owns the listing)
  const { data: givenRequests } = await supabase
    .from('pickup_requests')
    .select('listings:listing_id!inner(user_id)')
    .eq('status', 'completed')
    .eq('listings.user_id', id)

  const pickupsGiven = (givenRequests || []).length

  // Ratings
  const { data: ratingsData } = await supabase
    .from('ratings')
    .select('stars')
    .eq('ratee_id', id)

  const stars = (ratingsData || []).map((r: any) => r.stars)
  const avgRating = stars.length ? Math.round((stars.reduce((a: number, b: number) => a + b, 0) / stars.length) * 10) / 10 : null

  return NextResponse.json({
    id: userData.id,
    display_name: userData.display_name || userData.email?.split('@')[0],
    member_since: userData.created_at,
    listings_count: listingsCount || 0,
    pickups_given: pickupsGiven,
    avg_rating: avgRating,
    rating_count: stars.length,
    is_verified: property?.is_verified || false,
  })
}
