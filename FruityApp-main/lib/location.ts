/**
 * Location utilities for house detection and verification
 */

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Get user's current location using browser geolocation
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        let message = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            message = 'Location request timed out.'
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Check if user is near a specific location (within radius)
 * Default radius: 50 meters (about 164 feet)
 */
export function isNearLocation(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number = 50
): boolean {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng)
  return distance <= radiusMeters
}

/**
 * Get 3 nearest addresses from coordinates using Nominatim
 * Returns multiple nearby address options for the user to choose from
 */
export async function getNearbyAddresses(lat: number, lng: number): Promise<Array<{
  address: string
  city: string
  state: string
  zip_code: string
  lat: number
  lng: number
  distance: number
}>> {
  // Search for nearby addresses within ~100 meter radius
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FruityApp/1.0',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get nearby addresses')
    }

    const data = await response.json()

    if (!data || data.error) {
      throw new Error('Could not find addresses near this location')
    }

    const addressDetails = data.address || {}
    const baseAddress = data.display_name

    // Get the street and generate 3 nearby address options
    const street = addressDetails.road || addressDetails.street || ''
    const houseNumber = addressDetails.house_number || ''
    const city = addressDetails.city || addressDetails.town || addressDetails.village || addressDetails.municipality || ''
    const state = addressDetails.state || ''
    const zip = addressDetails.postcode || ''

    const results = []

    // Option 1: Exact detected location
    results.push({
      address: baseAddress,
      city,
      state,
      zip_code: zip,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      distance: 0
    })

    // If we have house number and street, generate nearby options
    if (houseNumber && street) {
      const baseNumber = parseInt(houseNumber.replace(/\D/g, ''))

      if (!isNaN(baseNumber)) {
        // Option 2: Previous house number (e.g., if detected 123, show 121)
        const prevNumber = baseNumber - 2
        if (prevNumber > 0) {
          const prevLat = lat - 0.00002 // ~2 meters south
          results.push({
            address: `${prevNumber} ${street}, ${city}, ${state} ${zip}`,
            city,
            state,
            zip_code: zip,
            lat: prevLat,
            lng: lng,
            distance: calculateDistance(lat, lng, prevLat, lng)
          })
        }

        // Option 3: Next house number (e.g., if detected 123, show 125)
        const nextNumber = baseNumber + 2
        const nextLat = lat + 0.00002 // ~2 meters north
        results.push({
          address: `${nextNumber} ${street}, ${city}, ${state} ${zip}`,
          city,
          state,
          zip_code: zip,
          lat: nextLat,
          lng: lng,
          distance: calculateDistance(lat, lng, nextLat, lng)
        })
      }
    }

    // Return up to 3 results
    return results.slice(0, 3)
  } catch (error: any) {
    console.error('Error getting nearby addresses:', error)
    throw new Error(error.message || 'Failed to get nearby addresses')
  }
}

/**
 * Get address from coordinates using reverse geocoding
 * Uses free Nominatim service (OpenStreetMap)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
  address: string
  city: string
  state: string
  zip_code: string
}> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`

  // Retry up to 3 times with delays for rate limiting
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
          'User-Agent': 'FruityApp/1.0', // Required by Nominatim
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Nominatim reverse geocode error:', response.status, errorText)

        // If rate limited (429 or 403), retry
        if (response.status === 429 || response.status === 403) {
          lastError = new Error('Rate limited by geocoding service. Retrying...')
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
        throw new Error(error.message || 'Failed to get address from your location. Please try again in a moment.')
      }
    }
  }

  // This shouldn't be reached, but just in case
  throw lastError || new Error('Failed to get address from your location')
}

/**
 * Watch user's location continuously
 */
export function watchLocation(
  onLocationUpdate: (coords: Coordinates) => void,
  onError: (error: Error) => void
): number {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'))
    return -1
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
    },
    (error) => {
      onError(new Error('Location tracking failed'))
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  )
}

/**
 * Stop watching location
 */
export function clearLocationWatch(watchId: number): void {
  if (navigator.geolocation && watchId !== -1) {
    navigator.geolocation.clearWatch(watchId)
  }
}
