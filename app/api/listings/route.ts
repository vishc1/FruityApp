import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress, fuzzyLocation } from '@/lib/geocoding'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// GET /api/listings - Fetch active listings
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const fruitType = searchParams.get('fruit_type')
  const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  const radiusMiles = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : null
  const userId = searchParams.get('user_id')

  let query = supabase
    .from('listings')
    .select('id, user_id, fruit_type, quantity, description, city, state, approximate_lat, approximate_lng, available_start, available_end, pickup_notes, status, availability_status, created_at')
    .order('created_at', { ascending: false })

  if (userId) {
    // Profile view: show all non-cancelled listings for this user
    query = query.eq('user_id', userId).neq('status', 'cancelled')
  } else {
    query = query.eq('status', 'active')
  }

  if (fruitType && fruitType !== 'all') {
    query = query.eq('fruit_type', fruitType)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let result = data || []

  // Client-side radius filter using haversine
  if (userLat !== null && userLng !== null && radiusMiles !== null) {
    result = result
      .map((listing: any) => ({
        ...listing,
        distance_miles: haversineDistance(userLat, userLng, listing.approximate_lat, listing.approximate_lng),
      }))
      .filter((listing: any) => listing.distance_miles <= radiusMiles)
      .sort((a: any, b: any) => a.distance_miles - b.distance_miles)
  }

  return NextResponse.json(result)
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
        latitude: geoResult.lat,
        longitude: geoResult.lng,
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
