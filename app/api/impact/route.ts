import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateImpact } from '@/lib/impact'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pickup_requests')
    .select(`
      listings:listing_id (
        fruit_type,
        quantity
      )
    `)
    .eq('status', 'completed')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const pickups = (data || [])
    .map((r: any) => r.listings)
    .filter(Boolean) as { fruit_type: string; quantity: string }[]

  const stats = calculateImpact(pickups)
  return NextResponse.json(stats)
}
