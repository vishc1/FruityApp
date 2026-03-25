import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/waitlist?listing_id=xxx — position + count
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listing_id')

  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
  }

  const { data: entries, error } = await supabase
    .from('waitlist_entries')
    .select('id, user_id, created_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = entries?.length || 0
  const position = user ? (entries?.findIndex((e: any) => e.user_id === user.id) ?? -1) + 1 : 0

  return NextResponse.json({ count, position: position > 0 ? position : null, on_waitlist: position > 0 })
}

// POST /api/waitlist — join waitlist
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { listing_id } = body

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('waitlist_entries')
      .insert({ listing_id, user_id: user.id })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already on waitlist' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/waitlist?listing_id=xxx — leave waitlist
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listing_id')

  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('waitlist_entries')
    .delete()
    .eq('listing_id', listingId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
