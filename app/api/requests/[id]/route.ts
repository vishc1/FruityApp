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
    const { status, proposed_time, confirmed_time, schedule_status } = body

    // Get request details
    const { data: pickupRequest, error: fetchError } = await supabase
      .from('pickup_requests')
      .select(`*, listings:listing_id (user_id)`)
      .eq('id', id)
      .single()

    if (fetchError || !pickupRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const listing = pickupRequest.listings as any

    // Build update object
    const updates: Record<string, any> = {}

    if (status) {
      if (status === 'accepted' || status === 'declined') {
        if (listing.user_id !== user.id) {
          return NextResponse.json({ error: 'Only listing owner can accept or decline' }, { status: 403 })
        }
      } else if (status === 'cancelled') {
        if (pickupRequest.requester_id !== user.id) {
          return NextResponse.json({ error: 'Only requester can cancel' }, { status: 403 })
        }
      } else if (status === 'completed') {
        if (pickupRequest.requester_id !== user.id && listing.user_id !== user.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
      }
      updates.status = status
    }

    // Scheduling: requester proposes, owner confirms or counter-proposes
    if (proposed_time !== undefined) {
      const isOwner = listing.user_id === user.id
      const isRequester = pickupRequest.requester_id === user.id
      if (!isOwner && !isRequester) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      updates.proposed_time = proposed_time
      updates.schedule_status = schedule_status || (isRequester ? 'proposed' : 'countered')
    }

    if (confirmed_time !== undefined) {
      if (listing.user_id !== user.id) {
        return NextResponse.json({ error: 'Only owner can confirm time' }, { status: 403 })
      }
      updates.confirmed_time = confirmed_time
      updates.schedule_status = 'confirmed'
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('pickup_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Keep listing status in sync with request status
    if (status === 'accepted') {
      // Hide listing from public map
      await supabase
        .from('listings')
        .update({ status: 'pending' })
        .eq('id', pickupRequest.listing_id)

      // Decline all other pending requests for this listing
      await supabase
        .from('pickup_requests')
        .update({ status: 'declined' })
        .eq('listing_id', pickupRequest.listing_id)
        .eq('status', 'pending')
        .neq('id', id)

    } else if (status === 'completed') {
      // Mark listing as completed
      await supabase
        .from('listings')
        .update({ status: 'completed' })
        .eq('id', pickupRequest.listing_id)

    } else if (status === 'declined' || status === 'cancelled') {
      // If this request was previously accepted, restore listing to active
      if (pickupRequest.status === 'accepted') {
        await supabase
          .from('listings')
          .update({ status: 'active' })
          .eq('id', pickupRequest.listing_id)
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
