import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddressFree } from '@/lib/geocoding-free'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 })
  }

  try {
    const result = await geocodeAddressFree(address)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
