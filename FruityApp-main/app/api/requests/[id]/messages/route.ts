import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/requests/:id/messages - Get all messages for a request
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

  // Verify user is part of this request
  const { data: pickupRequest } = await supabase
    .from('pickup_requests')
    .select(`
      *,
      listings:listing_id (user_id)
    `)
    .eq('id', id)
    .single()

  if (!pickupRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const listing = pickupRequest.listings as any
  if (pickupRequest.requester_id !== user.id && listing.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get messages
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      users:sender_id (
        id,
        display_name,
        email
      )
    `)
    .eq('pickup_request_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/requests/:id/messages - Send a message
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
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify user is part of this request
    const { data: pickupRequest } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listings:listing_id (user_id)
      `)
      .eq('id', id)
      .single()

    if (!pickupRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const listing = pickupRequest.listings as any
    if (pickupRequest.requester_id !== user.id && listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        pickup_request_id: id,
        sender_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        users:sender_id (
          id,
          display_name,
          email
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
