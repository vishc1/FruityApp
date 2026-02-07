import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress, fuzzyLocation } from '@/lib/geocoding'

// GET /api/listings - Fetch all active listings
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const fruitType = searchParams.get('fruit_type')

  let query = supabase
    .from('listings')
    .select('id, user_id, fruit_type, quantity, description, city, state, approximate_lat, approximate_lng, available_start, available_end, pickup_notes, status, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (fruitType && fruitType !== 'all') {
    query = query.eq('fruit_type', fruitType)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/listings - Create new listing
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { fruit_type, quantity, description, full_address, available_start, available_end, pickup_notes } = body

    // Validate required fields
    if (!fruit_type || !quantity || !full_address || !available_start || !available_end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Geocode address
    const geoResult = await geocodeAddress(full_address)

    // Add fuzzy offset for privacy
    const fuzzyCoords = fuzzyLocation(geoResult.lat, geoResult.lng)

    // Insert listing
    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        fruit_type,
        quantity,
        description,
        full_address,
        city: geoResult.city,
        state: geoResult.state,
        zip_code: geoResult.zip_code,
        approximate_lat: fuzzyCoords.lat,
        approximate_lng: fuzzyCoords.lng,
        available_start,
        available_end,
        pickup_notes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating listing:', error)
    return NextResponse.json({ error: error.message || 'Failed to create listing' }, { status: 500 })
  }
}
