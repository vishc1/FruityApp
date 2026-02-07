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

    // Update listing (RLS will ensure user owns it)
    const { data, error } = await supabase
      .from('listings')
      .update(body)
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
