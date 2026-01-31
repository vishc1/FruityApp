import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Listing } from '../types'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function MapPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<[number, number]>([37.7749, -122.4194]) // Default to SF

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Keep default location
        }
      )
    }

    fetchListings()
  }, [])

  const calculateDaysRemaining = (expirationDate: string | null | undefined): number | null => {
    if (!expirationDate) return null
    const now = new Date()
    const expDate = new Date(expirationDate)
    const diffTime = expDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load listings')
      console.error(error)
    } else {
      // Filter out expired listings and auto-cancel them
      const activeListings = (data || []).filter(listing => {
        const daysRemaining = calculateDaysRemaining(listing.expiration_date)
        if (daysRemaining !== null && daysRemaining <= 0) {
          // Auto-cancel expired listing
          supabase
            .from('listings')
            .update({ status: 'cancelled' })
            .eq('id', listing.id)
            .then(() => console.log(`Auto-cancelled expired listing ${listing.id}`))
          return false
        }
        return true
      })

      // Fetch user ratings for each listing
      const listingsWithUserData = await Promise.all(
        activeListings.map(async (listing) => {
          const { data: userData } = await supabase
            .from('users')
            .select('thumbs_up_count, thumbs_down_count')
            .eq('id', listing.user_id)
            .single()

          return {
            ...listing,
            user: userData
          }
        })
      )

      setListings(listingsWithUserData)
    }
    setLoading(false)
  }

  const requestPickup = async (listingId: string) => {
    if (!user) {
      toast.error('Please sign in to request pickup')
      return
    }

    const message = prompt('Add a message to the fruit owner (optional):')
    if (message === null) return // User cancelled

    try {
      const { error } = await supabase
        .from('pickup_requests')
        .insert({
          listing_id: listingId,
          requester_id: user.id,
          message: message || null,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a request for this listing')
        } else {
          toast.error('Failed to send request')
        }
      } else {
        toast.success('Pickup request sent! Check Messages for updates.')
        setSelectedListing(null)
      }
    } catch (error) {
      toast.error('Failed to send request')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">🍊</span>
              <h1 className="text-xl font-bold text-white drop-shadow-lg">Fruity Maps</h1>
            </Link>
            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-white hover:text-yellow-200 font-medium transition-colors">
                    📊 Dashboard
                  </Link>
                  <Link to="/messages" className="text-white hover:text-yellow-200 font-medium transition-colors">
                    💬 Messages
                  </Link>
                </>
              ) : (
                <Link to="/login" className="bg-white text-orange-600 hover:bg-yellow-50 font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {listings.map((listing) => (
              <Marker
                key={listing.id}
                position={[listing.latitude, listing.longitude]}
                eventHandlers={{
                  click: () => setSelectedListing(listing),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{listing.fruit_type}</h3>
                    <p className="text-sm text-gray-600">{listing.quantity}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {listing.city}, {listing.state}
                    </p>
                    {listing.expiration_date && (() => {
                      const daysRemaining = calculateDaysRemaining(listing.expiration_date)
                      if (daysRemaining !== null) {
                        return (
                          <p className={`text-xs font-semibold mt-1 ${
                            daysRemaining <= 2 ? 'text-red-600' :
                            daysRemaining <= 5 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            ⏰ {daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                          </p>
                        )
                      }
                      return null
                    })()}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Listing Detail Modal */}
        {selectedListing && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 w-96 max-w-[90vw] z-[1000] border-4 border-orange-200">
            <button
              onClick={() => setSelectedListing(null)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-full text-xl font-bold transition-all"
            >
              ×
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-5xl">🍊</div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{selectedListing.fruit_type}</h3>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-gray-700 flex items-center gap-2">
                <span className="font-bold text-orange-600">📦 Quantity:</span> {selectedListing.quantity}
              </p>
              {selectedListing.description && (
                <p className="text-gray-700 flex items-start gap-2">
                  <span className="font-bold text-orange-600">📝</span>
                  <span className="italic">"{selectedListing.description}"</span>
                </p>
              )}
              <p className="text-gray-700 flex items-center gap-2">
                <span className="font-bold text-orange-600">📍 Location:</span> {selectedListing.city}, {selectedListing.state}
              </p>
              <p className="text-gray-700 flex items-center gap-2">
                <span className="font-bold text-orange-600">📅 Available:</span>
                <span className="text-sm">{new Date(selectedListing.available_start).toLocaleDateString()} - {new Date(selectedListing.available_end).toLocaleDateString()}</span>
              </p>
              {selectedListing.expiration_date && (() => {
                const daysRemaining = calculateDaysRemaining(selectedListing.expiration_date)
                if (daysRemaining !== null) {
                  return (
                    <p className="text-gray-700 flex items-center gap-2">
                      <span className="font-bold text-orange-600">⏰ Freshness:</span>
                      <span className={`text-sm font-semibold ${
                        daysRemaining <= 2 ? 'text-red-600' :
                        daysRemaining <= 5 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                      </span>
                    </p>
                  )
                }
                return null
              })()}
              {selectedListing.user && (selectedListing.user.thumbs_up_count || selectedListing.user.thumbs_down_count) ? (
                <div className="flex items-center gap-3 pt-2 border-t border-gray-200 mt-2">
                  <span className="font-bold text-gray-700">Owner Rating:</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      👍 {selectedListing.user.thumbs_up_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-red-600 font-semibold">
                      👎 {selectedListing.user.thumbs_down_count || 0}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({Math.round(((selectedListing.user.thumbs_up_count || 0) / ((selectedListing.user.thumbs_up_count || 0) + (selectedListing.user.thumbs_down_count || 0))) * 100) || 0}% positive)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-2">
                  <span className="font-bold text-gray-700">Owner Rating:</span>
                  <span className="text-sm text-gray-500">No ratings yet</span>
                </div>
              )}
            </div>
            {user ? (
              selectedListing.user_id === user.id ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 text-center">
                  <p className="font-bold text-blue-800 flex items-center justify-center gap-2">
                    <span className="text-2xl">✨</span> This is your listing
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => requestPickup(selectedListing.id)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  🤝 Request Pickup
                </button>
              )
            ) : (
              <Link
                to="/login"
                className="block w-full text-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                Sign In to Request
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
