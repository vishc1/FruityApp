import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/listings/:id/requests - Create pickup request
export async function POST(
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
    const { message } = body

    // Check if listing exists and is active
    const { data: listing } = await supabase
      .from('listings')
      .select('id, user_id, status')
      .eq('id', id)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing is not active' }, { status: 400 })
    }

    if (listing.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot request your own listing' }, { status: 400 })
    }

    // Create request
    const { data, error } = await supabase
      .from('pickup_requests')
      .insert({
        listing_id: id,
        requester_id: user.id,
        message,
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate request
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You already have a request for this listing' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/listings/:id/requests - Get requests for a listing
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

  // Verify user owns the listing
  const { data: listing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get all requests for this listing
  const { data, error } = await supabase
    .from('pickup_requests')
    .select(`
      *,
      users:requester_id (
        id,
        email,
        display_name
      )
    `)
    .eq('listing_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
