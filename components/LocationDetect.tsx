'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LocationDetect() {
  const router = useRouter()
  const [detecting, setDetecting] = useState(false)
  const [address, setAddress] = useState('')

  const detect = async () => {
    setDetecting(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { latitude: lat, longitude: lng } = pos.coords
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'User-Agent': 'FruityApp/1.0' } }
      )
      const data = await res.json()
      const a = data.address || {}
      const city = a.city || a.town || a.village || a.municipality || ''
      const state = a.state || ''
      const detected = [city, state].filter(Boolean).join(', ')
      setAddress(detected)
      router.push(`/map?lat=${lat}&lng=${lng}&radius=5`)
    } catch {
      router.push('/map')
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
      <button
        onClick={detect}
        disabled={detecting}
        className="flex items-center gap-2 bg-white border-2 border-orange-200 hover:border-orange-400 text-gray-700 font-medium px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-60"
      >
        {detecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600" />
            Detecting...
          </>
        ) : (
          <>
            <span className="text-lg">📍</span>
            {address ? `Fruit near ${address}` : 'Find Fruit Near Me'}
          </>
        )}
      </button>
      {address && (
        <span className="text-sm text-gray-500">Showing listings within 5 miles</span>
      )}
    </div>
  )
}
