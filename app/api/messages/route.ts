import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages?request_id=xxx - Get messages for a pickup request
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const requestId = searchParams.get('request_id')

  if (!requestId) {
    return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
  }

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*)')
      .eq('pickup_request_id', requestId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(messages)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { pickup_request_id, content } = body

    if (!pickup_request_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        pickup_request_id,
        sender_id: user.id,
        content,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
