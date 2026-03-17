import { geocodeAddressFree } from './geocoding-free'

interface GeocodeResult {
  lat: number
  lng: number
  city: string
  state: string
  zip_code: string
  formatted_address: string
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  // Check if Mapbox token is available
  const hasMapboxToken =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN &&
    !process.env.NEXT_PUBLIC_MAPBOX_TOKEN.includes('your_token')

  // Use free Nominatim if no Mapbox token
  if (!hasMapboxToken) {
    console.log('🌍 [FREE MODE] Using Nominatim for geocoding (no Mapbox token)')
    return geocodeAddressFree(address)
  }

  // Use Mapbox if token is available
  const encodedAddress = encodeURIComponent(address)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to geocode address')
  }

  const data = await response.json()

  if (!data.features || data.features.length === 0) {
    throw new Error('Address not found')
  }

  const feature = data.features[0]
  const [lng, lat] = feature.center

  // Extract city, state, zip from context
  const context = feature.context || []
  const place = context.find((c: any) => c.id.startsWith('place'))
  const region = context.find((c: any) => c.id.startsWith('region'))
  const postcode = context.find((c: any) => c.id.startsWith('postcode'))

  return {
    lat,
    lng,
    city: place?.text || feature.text || '',
    state: region?.short_code?.replace('US-', '') || '',
    zip_code: postcode?.text || '',
    formatted_address: feature.place_name
  }
}

/**
 * Add random offset for privacy (approximately ±500 meters)
 * This ensures exact home locations are not shown publicly on the map
 */
export function fuzzyLocation(lat: number, lng: number): { lat: number; lng: number } {
  // Random offset between -0.005 and +0.005 degrees (roughly ±500 meters)
  const offsetLat = (Math.random() - 0.5) * 0.01
  const offsetLng = (Math.random() - 0.5) * 0.01

  return {
    lat: Number((lat + offsetLat).toFixed(8)),
    lng: Number((lng + offsetLng).toFixed(8))
  }
}

/**
 * Calculate distance between two coordinates in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
