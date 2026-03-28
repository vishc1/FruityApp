'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getCurrentLocation, getNearbyAddresses, calculateDistance } from '@/lib/location'
import toast from 'react-hot-toast'

interface DetectedProperty {
  address: string
  city: string
  state: string
  zip_code: string
  lat: number
  lng: number
  distance: number
}

export default function PropertySetupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [propertyOptions, setPropertyOptions] = useState<DetectedProperty[]>([])
  const [selectedProperty, setSelectedProperty] = useState<DetectedProperty | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [manualAddress, setManualAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)

  const detectLocation = async () => {
    setDetecting(true)
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      const nearbyAddresses = await getNearbyAddresses(location.lat, location.lng)
      setPropertyOptions(nearbyAddresses)
      toast.success(`Found ${nearbyAddresses.length} nearby address${nearbyAddresses.length > 1 ? 'es' : ''}!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to detect location')
    } finally {
      setDetecting(false)
    }
  }

  const saveProperty = async (property: { address: string; lat: number; lng: number }, distanceCheck?: number) => {
    if (distanceCheck !== undefined && distanceCheck > 50) {
      toast.error('You must be at your property to save it via auto-detect.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: property.address, lat: property.lat, lng: property.lng })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save property')
      }
      toast.success('Property saved!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleManualSave = async () => {
    if (!manualAddress.trim()) {
      toast.error('Please enter an address')
      return
    }
    setGeocoding(true)
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(manualAddress)}`)
      if (!res.ok) throw new Error('Address not found. Try a more specific address (e.g. "123 Main St, San Francisco, CA")')
      const geo = await res.json()
      await saveProperty({ address: geo.formatted_address || manualAddress, lat: geo.lat, lng: geo.lng })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGeocoding(false)
    }
  }

  useEffect(() => {
    if (propertyOptions.length === 0 || !userLocation) return
    const interval = setInterval(async () => {
      try {
        const currentLocation = await getCurrentLocation()
        const updatedOptions = propertyOptions.map(prop => ({
          ...prop,
          distance: calculateDistance(currentLocation.lat, currentLocation.lng, prop.lat, prop.lng)
        }))
        setPropertyOptions(updatedOptions)
        if (selectedProperty) {
          setSelectedProperty({ ...selectedProperty, distance: calculateDistance(currentLocation.lat, currentLocation.lng, selectedProperty.lat, selectedProperty.lng) })
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [propertyOptions, userLocation, selectedProperty])

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Property</h1>
          <p className="text-gray-600">Set your home address so you can create fruit listings.</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl shadow-sm p-1 w-fit">
          <button
            onClick={() => setMode('auto')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'auto' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-orange-600'}`}
          >
            📍 Detect Automatically
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'manual' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-orange-600'}`}
          >
            ✏️ Enter Manually
          </button>
        </div>

        {mode === 'manual' ? (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Enter Your Address</h3>
            <p className="text-sm text-gray-500 mb-4">Type your full address including city and state.</p>
            <input
              type="text"
              value={manualAddress}
              onChange={e => setManualAddress(e.target.value)}
              placeholder="e.g. 123 Main St, San Francisco, CA 94102"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
              onKeyDown={e => e.key === 'Enter' && handleManualSave()}
            />
            <button
              onClick={handleManualSave}
              disabled={loading || geocoding || !manualAddress.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {geocoding ? 'Looking up address...' : loading ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {propertyOptions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to detect your location</h3>
                <p className="text-gray-600 mb-6">Make sure you're at your home, then click below.</p>
                <button
                  onClick={detectLocation}
                  disabled={detecting}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {detecting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Detecting...
                    </span>
                  ) : '📍 Detect My Location'}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Your Address</h3>
                <div className="space-y-3 mb-6">
                  {propertyOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedProperty(option)}
                      className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                        selectedProperty?.address === option.address ? 'border-orange-600 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🏠</span>
                            <p className="font-semibold text-gray-900">{option.address.split(',')[0]}</p>
                          </div>
                          <p className="text-sm text-gray-600 ml-8">{option.city}, {option.state} {option.zip_code}</p>
                          <p className="text-xs text-gray-500 ml-8 mt-1">{option.distance < 1 ? '< 1' : Math.round(option.distance)} meters away</p>
                        </div>
                        {selectedProperty?.address === option.address && (
                          <span className="text-orange-600 text-xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {selectedProperty && selectedProperty.distance > 50 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">⚠️ You're {Math.round(selectedProperty.distance)}m away. Go to your property to verify, or use "Enter Manually" instead.</p>
                  </div>
                )}
                {selectedProperty && selectedProperty.distance <= 50 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">✓ You're at this location!</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => selectedProperty && saveProperty(selectedProperty, selectedProperty.distance)}
                    disabled={loading || !selectedProperty || (!!selectedProperty && selectedProperty.distance > 50)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Property'}
                  </button>
                  <button
                    onClick={() => { setPropertyOptions([]); setSelectedProperty(null); setUserLocation(null) }}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Detect Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-900 mb-2">🔒 Privacy</p>
          <p>✓ Your exact address is never shown publicly</p>
          <p>✓ Listings show only an approximate location (±500m)</p>
          <p>✓ Full address revealed only after you accept a pickup</p>
        </div>
      </div>
    </div>
  )
}
