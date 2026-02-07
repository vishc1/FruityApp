import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/requests/:id - Get single request with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // Verify user is involved in this request
  const listing = data.listings as any
  if (data.requester_id !== user.id && listing.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Hide full address if not accepted and user is requester
  if (data.status !== 'accepted' && data.requester_id === user.id && listing) {
    const { full_address, ...listingWithoutAddress } = listing
    return NextResponse.json({ ...data, listings: listingWithoutAddress })
  }

  return NextResponse.json(data)
}

// PATCH /api/requests/:id - Update request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Get request details
    const { data: pickupRequest, error: fetchError } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listings:listing_id (user_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !pickupRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const listing = pickupRequest.listings as any

    // Check permissions based on status change
    if (status === 'accepted' || status === 'declined') {
      // Only listing owner can accept/decline
      if (listing.user_id !== user.id) {
        return NextResponse.json({ error: 'Only listing owner can accept or decline' }, { status: 403 })
      }
    } else if (status === 'cancelled') {
      // Only requester can cancel
      if (pickupRequest.requester_id !== user.id) {
        return NextResponse.json({ error: 'Only requester can cancel' }, { status: 403 })
      }
    } else if (status === 'completed') {
      // Both can mark as completed
      if (pickupRequest.requester_id !== user.id && listing.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Update request
    const { data, error } = await supabase
      .from('pickup_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
