import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/listings/:id - Get single listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch listing
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Check if user can see full address
  let canSeeAddress = false

  if (user) {
    // Owner can see
    if (listing.user_id === user.id) {
      canSeeAddress = true
    } else {
      // Check if user has accepted request
      const { data: acceptedRequest } = await supabase
        .from('pickup_requests')
        .select('id')
        .eq('listing_id', id)
        .eq('requester_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle()

      if (acceptedRequest) {
        canSeeAddress = true
      }
    }
  }

  // Remove full address if not authorized
  if (!canSeeAddress) {
    const { full_address, ...publicListing } = listing
    return NextResponse.json(publicListing)
  }

  return NextResponse.json(listing)
}

// PATCH /api/listings/:id - Update listing
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

    // Allowlist only the fields owners are permitted to change
    const {
      availability_status,
      description,
      pickup_notes,
      available_start,
      available_end,
      photo_url,
      quantity,
    } = body

    const updates: Record<string, any> = {}
    if (availability_status !== undefined) updates.availability_status = availability_status
    if (description !== undefined) updates.description = description
    if (pickup_notes !== undefined) updates.pickup_notes = pickup_notes
    if (available_start !== undefined) updates.available_start = available_start
    if (available_end !== undefined) updates.available_end = available_end
    if (photo_url !== undefined) updates.photo_url = photo_url
    if (quantity !== undefined) updates.quantity = quantity

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
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

// DELETE /api/listings/:id - Delete listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
