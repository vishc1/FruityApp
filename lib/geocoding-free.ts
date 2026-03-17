/**
 * FREE Geocoding using Nominatim (OpenStreetMap)
 * No API key required!
 */

interface GeocodeResult {
  lat: number
  lng: number
  city: string
  state: string
  zip_code: string
  formatted_address: string
}

/**
 * Geocode address using Nominatim (OpenStreetMap) - FREE!
 * Rate limit: 1 request per second
 */
export async function geocodeAddressFree(address: string): Promise<GeocodeResult> {
  const encodedAddress = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&addressdetails=1&limit=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FruityApp/1.0', // Required by Nominatim
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Nominatim API error:', response.status, errorText)
      throw new Error(`Failed to geocode address: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('Address not found. Please enter a valid street address with city and state (e.g., "123 Main St, San Francisco, CA")')
    }

    const result = data[0]
    const addressDetails = result.address || {}

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      city:
        addressDetails.city ||
        addressDetails.town ||
        addressDetails.village ||
        addressDetails.municipality ||
        '',
      state: addressDetails.state || '',
      zip_code: addressDetails.postcode || '',
      formatted_address: result.display_name,
    }
  } catch (error: any) {
    console.error('Geocoding error:', error)
    throw new Error(error.message || 'Failed to geocode address')
  }
}

/**
 * Reverse geocode (coordinates to address) - FREE!
 * Includes retry logic for rate limiting
 */
export async function reverseGeocodeFree(
  lat: number,
  lng: number
): Promise<{
  address: string
  city: string
  state: string
  zip_code: string
}> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`

  // Retry up to 3 times with increasing delays
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add delay between retries (1 second, 2 seconds, 3 seconds)
      if (attempt > 0) {
        console.log(`Retrying reverse geocode (attempt ${attempt + 1}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FruityApp/1.0',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Nominatim reverse geocode error:', response.status, errorText)

        // If rate limited (429 or 403), retry
        if (response.status === 429 || response.status === 403) {
          lastError = new Error('Rate limited by geocoding service. Please wait...')
          continue
        }

        throw new Error(`Failed to get address from GPS location: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data || data.error) {
        throw new Error('Could not find address for this location. Make sure you are at a valid street address.')
      }

      const addressDetails = data.address || {}

      return {
        address: data.display_name,
        city:
          addressDetails.city ||
          addressDetails.town ||
          addressDetails.village ||
          addressDetails.municipality ||
          '',
        state: addressDetails.state || '',
        zip_code: addressDetails.postcode || '',
      }
    } catch (error: any) {
      console.error(`Reverse geocoding error (attempt ${attempt + 1}):`, error)
      lastError = error

      // If it's the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw new Error(error.message || 'Failed to get address from your location')
      }
    }
  }

  // This shouldn't be reached, but just in case
  throw lastError || new Error('Failed to get address from your location')
}

/**
 * Add random offset for privacy (approximately ±500 meters)
 */
export function fuzzyLocation(lat: number, lng: number): { lat: number; lng: number } {
  const offsetLat = (Math.random() - 0.5) * 0.01
  const offsetLng = (Math.random() - 0.5) * 0.01

  return {
    lat: Number((lat + offsetLat).toFixed(8)),
    lng: Number((lng + offsetLng).toFixed(8)),
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
