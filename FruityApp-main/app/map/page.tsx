'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PublicListing } from '@/lib/types/database'
import { FRUIT_TYPES } from '@/lib/utils'
import toast from 'react-hot-toast'

// Dynamically import the map to avoid SSR issues
const FruitMap = dynamic(() => import('@/components/FruitMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  ),
})

export default function MapPage() {
  const [listings, setListings] = useState<PublicListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedListing, setSelectedListing] = useState<PublicListing | null>(null)

  useEffect(() => {
    fetchListings()
  }, [selectedType])

  const fetchListings = async () => {
    try {
      const url = selectedType === 'all'
        ? '/api/listings'
        : `/api/listings?fruit_type=${selectedType}`

      const response = await fetch(url)
      const data = await response.json()
      setListings(data)
    } catch (error) {
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-3xl">🍊</span>
              <h1 className="text-xl font-bold text-orange-600">Fruity</h1>
            </Link>
            <Link
              href="/login"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Sign In to Request
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="mb-6">
          <label htmlFor="fruit-type" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by fruit type:
          </label>
          <select
            id="fruit-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Fruits</option>
            {FRUIT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Map Section */}
        {!loading && listings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Map View ({listings.length} {listings.length === 1 ? 'listing' : 'listings'})
            </h2>
            <FruitMap
              listings={listings}
              center={[listings[0].approximate_lat, listings[0].approximate_lng]}
              zoom={11}
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
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => setSelectedListing(listing)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{listing.fruit_type}</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                    Active
                  </span>
                </div>
                <p className="text-gray-600 mb-2">
                  <strong>Quantity:</strong> {listing.quantity}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>Location:</strong> {listing.city}, {listing.state}
                </p>
                <p className="text-gray-600 mb-3">
                  <strong>Available:</strong> {new Date(listing.available_start).toLocaleDateString()} - {new Date(listing.available_end).toLocaleDateString()}
                </p>
                {listing.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{listing.description}</p>
                )}
                <Link
                  href={`/listings/${listing.id}`}
                  className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
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
            className="bg-white rounded-lg max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedListing.fruit_type}</h2>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-gray-400 hover:text-gray-600"
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
              href="/login"
              className="block mt-6 w-full text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Sign In to Request Pickup
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
