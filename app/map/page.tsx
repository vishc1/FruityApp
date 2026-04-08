'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PublicListing } from '@/lib/types/database'
import { FRUIT_TYPES, FRUIT_EMOJIS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Nav from '@/components/Nav'

// Dynamically import the map to avoid SSR issues
const FruitMap = dynamic(() => import('@/components/FruitMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  ),
})

const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50]

export default function MapPage() {
  const [listings, setListings] = useState<(PublicListing & { distance_miles?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedListing, setSelectedListing] = useState<PublicListing | null>(null)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [radiusMiles, setRadiusMiles] = useState(10)
  const [locating, setLocating] = useState(false)
  const [useRadius, setUseRadius] = useState(false)


  useEffect(() => {
    fetchListings()
  }, [selectedType, userLat, userLng, radiusMiles, useRadius])

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.set('fruit_type', selectedType)
      if (useRadius && userLat !== null && userLng !== null) {
        params.set('lat', String(userLat))
        params.set('lng', String(userLng))
        params.set('radius', String(radiusMiles))
      }
      const response = await fetch(`/api/listings?${params}`)
      if (!response.ok) throw new Error('Failed to fetch listings')
      const data = await response.json()
      setListings(data)
    } catch {
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setUseRadius(true)
        setLocating(false)
        toast.success('Location detected!')
      },
      () => {
        toast.error('Could not get your location')
        setLocating(false)
      }
    )
  }

  const clearRadius = () => {
    setUseRadius(false)
    setUserLat(null)
    setUserLng(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Fruit type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fruit type</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">🍊 All Fruits</option>
                {FRUIT_TYPES.map(type => (
                  <option key={type} value={type}>{FRUIT_EMOJIS[type] || '🌳'} {type}</option>
                ))}
              </select>
            </div>

            {/* Radius search */}
            <div className="flex items-end gap-2">
              {useRadius && userLat !== null ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Radius</label>
                    <select
                      value={radiusMiles}
                      onChange={e => setRadiusMiles(Number(e.target.value))}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r} mile{r > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={clearRadius}
                    className="text-sm text-gray-500 hover:text-red-600 py-2 px-3 border border-gray-300 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <button
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex items-center gap-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium py-2 px-4 border border-orange-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {locating ? '...' : '📍 Near me'}
                </button>
              )}
            </div>

            {/* Result count */}
            <div className="ml-auto text-sm text-gray-500">
              {!loading && `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
              {useRadius && userLat !== null && ` within ${radiusMiles} mi`}
            </div>
          </div>
        </div>

        {/* Map Section */}
        {!loading && (listings.length > 0 || (userLat !== null)) && (
          <div className="mb-8">
            <FruitMap
              listings={listings}
              center={userLat !== null ? [userLat, userLng!] : listings.length > 0 ? [listings[0].approximate_lat, listings[0].approximate_lng] : [37.7749, -122.4194]}
              zoom={useRadius ? Math.max(10, 13 - Math.floor(radiusMiles / 5)) : 11}
            />
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="mt-2 text-gray-600">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600 mb-4">No fruit listings yet in your area</p>
            <Link
              href="/listings/new"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Be the first to share!
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <div
                key={listing.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => setSelectedListing(listing)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{FRUIT_EMOJIS[listing.fruit_type] || '🍊'}</span>
                    <h3 className="text-xl font-bold text-gray-900">{listing.fruit_type}</h3>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-gray-600 mb-1 text-sm">
                  <span className="font-medium">Qty:</span> {listing.quantity}
                </p>
                <p className="text-gray-500 mb-1 text-sm">
                  📍 {listing.city}, {listing.state}
                  {(listing as any).distance_miles !== undefined && (
                    <span className="ml-2 text-orange-600 font-medium">
                      {(listing as any).distance_miles.toFixed(1)} mi away
                    </span>
                  )}
                </p>
                <p className="text-gray-500 mb-3 text-sm">
                  📅 {new Date(listing.available_start).toLocaleDateString()} – {new Date(listing.available_end).toLocaleDateString()}
                </p>
                {listing.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{listing.description}</p>
                )}
                <Link
                  href={`/listings/${listing.id}`}
                  className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{FRUIT_EMOJIS[selectedListing.fruit_type] || '🍊'}</span>
                <h2 className="text-2xl font-bold text-gray-900">{selectedListing.fruit_type}</h2>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p><strong>Quantity:</strong> {selectedListing.quantity}</p>
              <p><strong>Location:</strong> {selectedListing.city}, {selectedListing.state}</p>
              <p><strong>Available:</strong> {new Date(selectedListing.available_start).toLocaleDateString()} - {new Date(selectedListing.available_end).toLocaleDateString()}</p>
              {selectedListing.description && (
                <p><strong>Description:</strong> {selectedListing.description}</p>
              )}
              {selectedListing.pickup_notes && (
                <p><strong>Pickup Notes:</strong> {selectedListing.pickup_notes}</p>
              )}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  🔒 <strong>Privacy:</strong> The exact address is hidden for safety.
                  It will be revealed only after the owner accepts your pickup request.
                </p>
              </div>
            </div>
            <Link
              href={`/listings/${selectedListing.id}`}
              className="block mt-6 w-full text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Details & Request Pickup
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
