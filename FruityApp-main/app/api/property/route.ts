import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/property - Get user's property
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/property - Create or update user's property
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { address, lat, lng } = body

    if (!address || !lat || !lng) {
      return NextResponse.json(
        { error: 'Address, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    // Check if property already exists
    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result

    if (existing) {
      // Update existing property
      const { data, error } = await supabase
        .from('properties')
        .update({
          address,
          lat,
          lng,
          is_verified: true,
          detected_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new property
      const { data, error } = await supabase
        .from('properties')
        .insert({
          user_id: user.id,
          address,
          lat,
          lng,
          is_verified: true
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error saving property:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save property' },
      { status: 500 }
    )
  }
}

// DELETE /api/property - Delete user's property
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
