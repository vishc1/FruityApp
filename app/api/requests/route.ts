import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/requests?type=outgoing|incoming
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'outgoing'

  if (type === 'history') {
    // Completed/declined/cancelled requests for the current user
    const { data, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listings:listing_id (*)
      `)
      .eq('requester_id', user.id)
      .in('status', ['completed', 'declined', 'cancelled', 'expired'])
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } else if (type === 'outgoing') {
    // Requests made by current user
    const { data, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listings:listing_id (*)
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter out full_address for non-accepted requests
    const filteredData = data.map((request: any) => {
      if (request.status !== 'accepted' && request.listings) {
        const { full_address, ...listingWithoutAddress } = request.listings as any
        return { ...request, listings: listingWithoutAddress }
      }
      return request
    })

    return NextResponse.json(filteredData)
  } else {
    // Get user's listing IDs first
    const { data: userListings } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', user.id)

    const listingIds = (userListings || []).map((l: any) => l.id)

    if (listingIds.length === 0) {
      return NextResponse.json([])
    }

    const { data, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listings:listing_id (*),
        users:requester_id (
          id,
          display_name,
          email
        )
      `)
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }
}
