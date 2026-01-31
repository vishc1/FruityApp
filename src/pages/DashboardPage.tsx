import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Listing, PickupRequest } from '../types'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'listings' | 'requests' | 'incoming'>('listings')
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myRequests, setMyRequests] = useState<PickupRequest[]>([])
  const [incomingRequests, setIncomingRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [completingRequest, setCompletingRequest] = useState<PickupRequest | null>(null)
  const [pickedQuantity, setPickedQuantity] = useState('')
  const [rating, setRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [userRatings, setUserRatings] = useState<{ thumbs_up_count: number; thumbs_down_count: number }>({ thumbs_up_count: 0, thumbs_down_count: 0 })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (activeTab === 'listings') {
      fetchMyListings()
    } else if (activeTab === 'requests') {
      fetchMyRequests()
    } else {
      fetchIncomingRequests()
    }
  }, [user, activeTab, navigate])

  const fetchMyListings = async () => {
    if (!user) return
    setLoading(true)

    // Fetch user ratings
    const { data: userData } = await supabase
      .from('users')
      .select('thumbs_up_count, thumbs_down_count')
      .eq('id', user.id)
      .single()

    if (userData) {
      setUserRatings(userData)
    }

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load listings')
    } else {
      setMyListings(data || [])
    }
    setLoading(false)
  }

  const fetchMyRequests = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listing:listings(
          id,
          fruit_type,
          quantity,
          city,
          state,
          full_address
        )
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load requests')
    } else {
      setMyRequests(data || [])
    }
    setLoading(false)
  }

  const fetchIncomingRequests = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        listing:listings!inner(
          id,
          fruit_type,
          quantity,
          city,
          state,
          full_address,
          user_id
        )
      `)
      .eq('listings.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching incoming requests:', error)
      toast.error('Failed to load incoming requests')
    } else {
      setIncomingRequests(data || [])
    }
    setLoading(false)
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete listing')
    } else {
      toast.success('Listing deleted')
      fetchMyListings()
    }
  }

  const acceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('pickup_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (error) {
      toast.error('Failed to accept request')
      console.error(error)
    } else {
      toast.success('Request accepted! The requester can now see your full address.')
      fetchIncomingRequests()
    }
  }

  const declineRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to decline this request?')) return

    const { error } = await supabase
      .from('pickup_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)

    if (error) {
      toast.error('Failed to decline request')
      console.error(error)
    } else {
      toast.success('Request declined')
      fetchIncomingRequests()
    }
  }

  const openCompleteModal = (request: PickupRequest) => {
    setCompletingRequest(request)
    setPickedQuantity('')
    setRating(null)
  }

  const closeCompleteModal = () => {
    setCompletingRequest(null)
    setPickedQuantity('')
    setRating(null)
  }

  const completePickup = async () => {
    if (!completingRequest || !rating || !pickedQuantity.trim()) {
      toast.error('Please provide quantity picked and rating')
      return
    }

    setSubmitting(true)
    try {
      // Update the pickup request
      const { error: requestError } = await supabase
        .from('pickup_requests')
        .update({
          status: 'completed',
          rating: rating,
          picked_up_quantity: pickedQuantity.trim(),
          completed_at: new Date().toISOString()
        })
        .eq('id', completingRequest.id)

      if (requestError) {
        toast.error('Failed to complete pickup')
        console.error(requestError)
        return
      }

      // Update the listing owner's rating
      if (completingRequest.listing?.user_id) {
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('thumbs_up_count, thumbs_down_count')
          .eq('id', completingRequest.listing.user_id)
          .single()

        if (fetchError) {
          console.error('Error fetching user ratings:', fetchError)
        } else {
          const updateField = rating === 'thumbs_up' ? 'thumbs_up_count' : 'thumbs_down_count'
          const currentCount = rating === 'thumbs_up'
            ? (userData.thumbs_up_count || 0)
            : (userData.thumbs_down_count || 0)

          const { error: updateError } = await supabase
            .from('users')
            .update({ [updateField]: currentCount + 1 })
            .eq('id', completingRequest.listing.user_id)

          if (updateError) {
            console.error('Error updating user rating:', updateError)
          }
        }
      }

      toast.success(`Pickup completed! ${rating === 'thumbs_up' ? '👍' : '👎'} Rating submitted.`)
      closeCompleteModal()
      fetchMyRequests()
    } catch (error) {
      toast.error('Failed to complete pickup')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const calculateDaysRemaining = (expirationDate: string | null | undefined): number | null => {
    if (!expirationDate) return null
    const now = new Date()
    const expDate = new Date(expirationDate)
    const diffTime = expDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md',
      pending: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md',
      accepted: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',
      completed: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md',
      declined: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',
      cancelled: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md',
    }
    return (
      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-500 text-white'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">🍊</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">Fruity</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/map" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                🗺️ Find Fruit
              </Link>
              <Link to="/messages" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                💬 Messages
              </Link>
              <Link
                to="/listings/new"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                ✨ New Listing
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg mb-4">Welcome back, <span className="font-semibold text-orange-600">{user.email}</span>! 🎉</p>

          {/* User Rating Display */}
          {(userRatings.thumbs_up_count || userRatings.thumbs_down_count) ? (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <span className="font-bold text-gray-700">Your Rating:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  👍 {userRatings.thumbs_up_count || 0}
                </span>
                <span className="flex items-center gap-1 text-red-600 font-semibold">
                  👎 {userRatings.thumbs_down_count || 0}
                </span>
                <span className="text-sm text-gray-500">
                  ({Math.round(((userRatings.thumbs_up_count || 0) / ((userRatings.thumbs_up_count || 0) + (userRatings.thumbs_down_count || 0))) * 100) || 0}% positive)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <span className="font-bold text-gray-700">Your Rating:</span>
              <span className="text-sm text-gray-500">No ratings yet - complete some pickups to build your reputation!</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg mb-6">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 py-3 px-6 font-bold rounded-xl transition-all ${
                activeTab === 'listings'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-orange-50'
              }`}
            >
              🌳 My Listings
            </button>
            <button
              onClick={() => setActiveTab('incoming')}
              className={`flex-1 py-3 px-6 font-bold rounded-xl transition-all ${
                activeTab === 'incoming'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-orange-50'
              }`}
            >
              📥 Incoming Requests
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-6 font-bold rounded-xl transition-all ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-orange-50'
              }`}
            >
              📦 My Requests
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : activeTab === 'incoming' ? (
          <div>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                <div className="text-6xl mb-4">📥</div>
                <p className="text-gray-600 text-lg mb-6">No incoming requests yet</p>
                <p className="text-sm text-gray-500">When someone requests fruit from your listings, they'll appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 border-2 border-purple-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🍊</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{request.listing?.fruit_type}</h3>
                          <p className="text-sm text-gray-600">📍 {request.listing?.city}, {request.listing?.state}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="font-semibold text-purple-600">📦 Quantity:</span> {request.listing?.quantity}
                      </p>
                      {request.message && (
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-purple-600">💬 Message:</span>
                          <span className="italic">"{request.message}"</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        🕒 Requested on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => acceptRequest(request.id)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                        >
                          ✅ Accept Request
                        </button>
                        <button
                          onClick={() => declineRequest(request.id)}
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                        >
                          ❌ Decline
                        </button>
                      </div>
                    )}
                    {request.status === 'accepted' && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                        <p className="text-green-900 font-semibold flex items-center gap-2">
                          <span className="text-xl">✅</span> Request Accepted - Requester can see your full address
                        </p>
                      </div>
                    )}
                    {request.status === 'declined' && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl">
                        <p className="text-red-900 font-semibold flex items-center gap-2">
                          <span className="text-xl">❌</span> Request Declined
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'listings' ? (
          <div>
            {myListings.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                <div className="text-6xl mb-4">🌳</div>
                <p className="text-gray-600 text-lg mb-6">You haven't created any listings yet</p>
                <Link
                  to="/listings/new"
                  className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  🍊 Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <div key={listing.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 border-2 border-orange-100">
                    {listing.image_url && (
                      <div className="w-full h-48 overflow-hidden bg-gray-100">
                        <img
                          src={listing.image_url}
                          alt={listing.fruit_type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">🍊</span>
                          <h3 className="text-xl font-bold text-gray-900">{listing.fruit_type}</h3>
                        </div>
                        {getStatusBadge(listing.status)}
                      </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="font-semibold text-orange-600">📦 Quantity:</span> {listing.quantity}
                      </p>
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="font-semibold text-orange-600">📅 Available:</span>
                        <span className="text-sm">{new Date(listing.available_start).toLocaleDateString()} - {new Date(listing.available_end).toLocaleDateString()}</span>
                      </p>
                      {listing.expiration_date && (() => {
                        const daysRemaining = calculateDaysRemaining(listing.expiration_date)
                        if (daysRemaining !== null) {
                          return (
                            <p className="text-gray-700 flex items-center gap-2">
                              <span className="font-semibold text-orange-600">⏰ Freshness:</span>
                              <span className={`text-sm font-bold ${
                                daysRemaining <= 0 ? 'text-red-700' :
                                daysRemaining <= 2 ? 'text-red-600' :
                                daysRemaining <= 5 ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {daysRemaining <= 0 ? 'Expired!' : daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                              </span>
                            </p>
                          )
                        }
                        return null
                      })()}
                    </div>
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                      >
                        🗑️ Delete Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {myRequests.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-600 text-lg mb-6">You haven't requested any fruit yet</p>
                <Link
                  to="/map"
                  className="inline-block bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  🌍 Find Fruit Near You
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div key={request.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 border-2 border-green-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🍊</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{request.listing?.fruit_type}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            📍 {request.listing?.city}, {request.listing?.state}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="font-semibold text-green-600">📦 Quantity:</span> {request.listing?.quantity}
                      </p>
                      {request.message && (
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-green-600">💬 Message:</span>
                          <span className="italic">"{request.message}"</span>
                        </p>
                      )}
                    </div>
                    {request.status === 'accepted' && request.listing?.full_address && (
                      <div className="mt-4 space-y-3">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-md">
                          <p className="font-bold text-green-900 mb-2 flex items-center gap-2">
                            <span className="text-2xl">✅</span> Request Accepted!
                          </p>
                          <p className="text-sm text-green-800 flex items-center gap-2">
                            <strong>📍 Pickup Address:</strong> {request.listing.full_address}
                          </p>
                        </div>
                        <button
                          onClick={() => openCompleteModal(request)}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                        >
                          ✅ Mark as Completed
                        </button>
                      </div>
                    )}
                    {request.status === 'completed' && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl">
                        <p className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <span className="text-2xl">🎉</span> Pickup Completed!
                        </p>
                        <p className="text-sm text-purple-800">
                          <strong>Picked up:</strong> {request.picked_up_quantity}
                        </p>
                        <p className="text-sm text-purple-800 flex items-center gap-2 mt-1">
                          <strong>Rating given:</strong>
                          {request.rating === 'thumbs_up' ? '👍 Thumbs Up' : '👎 Thumbs Down'}
                        </p>
                        {request.completed_at && (
                          <p className="text-xs text-purple-700 mt-2">
                            Completed on {new Date(request.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                      🕒 Requested on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complete Pickup Modal */}
      {completingRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Pickup</h2>
            <p className="text-gray-600 mb-6">
              Please provide details about your pickup of <strong>{completingRequest.listing?.fruit_type}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How much did you pick up?
                </label>
                <input
                  type="text"
                  value={pickedQuantity}
                  onChange={(e) => setPickedQuantity(e.target.value)}
                  placeholder="e.g., 5 lbs, 10 oranges, etc."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rate your experience
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setRating('thumbs_up')}
                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                      rating === 'thumbs_up'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👍 Good
                  </button>
                  <button
                    onClick={() => setRating('thumbs_down')}
                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                      rating === 'thumbs_down'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👎 Bad
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeCompleteModal}
                disabled={submitting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={completePickup}
                disabled={submitting || !rating || !pickedQuantity.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
