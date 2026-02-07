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

  if (type === 'outgoing') {
    // Requests made by current user
    const { data, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listings:listing_id (
          id, fruit_type, quantity, city, state, approximate_lat, approximate_lng, full_address, status
        )
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
    // Requests for current user's listings
    const { data, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listings!inner (
          id, fruit_type, quantity, user_id, full_address
        ),
        users:requester_id (
          id,
          display_name,
          email
        )
      `)
      .eq('listings.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }
}
