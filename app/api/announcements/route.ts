import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/announcements
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const state = searchParams.get('state')

  let query = supabase
    .from('announcements')
    .select('*, users:author_id(display_name, email)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (city) query = query.eq('city', city)
  if (state) query = query.eq('state', state)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/announcements
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, body: content, city, state } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({ author_id: user.id, title: title.trim(), body: content.trim(), city, state })
      .select('*, users:author_id(display_name, email)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
