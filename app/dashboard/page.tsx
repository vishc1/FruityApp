'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FRUIT_EMOJIS } from '@/lib/utils'
import Nav from '@/components/Nav'

type AvailabilityStatus = 'available' | 'almost_gone' | 'picked_clean'

interface Listing {
  id: string
  fruit_type: string
  quantity: string
  status: string
  availability_status: AvailabilityStatus
  created_at: string
  available_start: string
  available_end: string
}

interface Request {
  id: string
  status: string
  message: string | null
  created_at: string
  proposed_time?: string | null
  confirmed_time?: string | null
  schedule_status?: string
  listings: {
    id: string
    fruit_type: string
    quantity: string
    city: string
    state: string
    full_address?: string
    user_id?: string
  }
}

interface IncomingRequest {
  id: string
  status: string
  message: string | null
  created_at: string
  requester_id: string
  proposed_time?: string | null
  confirmed_time?: string | null
  schedule_status?: string
  listings: {
    id: string
    fruit_type: string
    quantity: string
    city: string
    state: string
  }
  users?: { email: string; display_name: string | null }
}

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; cls: string }[] = [
  { value: 'available', label: 'Available', cls: 'bg-green-100 text-green-800' },
  { value: 'almost_gone', label: 'Almost Gone', cls: 'bg-yellow-100 text-yellow-800' },
  { value: 'picked_clean', label: 'Picked Clean', cls: 'bg-red-100 text-red-800' },
]

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const opt = AVAILABILITY_OPTIONS.find(o => o.value === status) || AVAILABILITY_OPTIONS[0]
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${opt.cls}`}>{opt.label}</span>
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-2xl ${n <= value ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}>
          ★
        </button>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'listings' | 'requests' | 'incoming' | 'history'>('listings')
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([])
  const [history, setHistory] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  // Scheduling state for incoming requests
  const [counterTime, setCounterTime] = useState<Record<string, string>>({})
  const [showCounter, setShowCounter] = useState<Record<string, boolean>>({})
  // Review state
  const [reviewForm, setReviewForm] = useState<Record<string, { stars: number; text: string; open: boolean }>>({})

  useEffect(() => {
    const supabase = createClient()
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) { setUser(session.user); setLoading(false) }
      else router.push('/login')
    })
    return () => { subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (user) {
      if (activeTab === 'listings') fetchMyListings()
      else if (activeTab === 'requests') fetchMyRequests()
      else if (activeTab === 'incoming') fetchIncomingRequests()
      else fetchHistory()
    }
  }, [user, activeTab])

  // Pre-load incoming count for badge
  useEffect(() => {
    if (user && activeTab !== 'incoming') {
      fetch('/api/requests?type=incoming')
        .then(r => r.ok ? r.json() : [])
        .then(data => setIncomingRequests(data || []))
        .catch(() => {})
    }
  }, [user])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) { setUser(session.user); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { setUser(user); setLoading(false); return }
    await new Promise(r => setTimeout(r, 500))
    const { data: { session: retry } } = await supabase.auth.getSession()
    if (retry?.user) { setUser(retry.user); setLoading(false) }
    else router.push('/login')
  }

  const fetchMyListings = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load listings')
    else setMyListings(data || [])
    setLoading(false)
  }

  const fetchMyRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/requests?type=outgoing')
      setMyRequests((await res.json()) || [])
    } catch { toast.error('Failed to load requests') }
    setLoading(false)
  }

  const fetchIncomingRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/requests?type=incoming')
      setIncomingRequests((await res.json()) || [])
    } catch { toast.error('Failed to load requests') }
    setLoading(false)
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/requests?type=history')
      setHistory((await res.json()) || [])
    } catch { toast.error('Failed to load history') }
    setLoading(false)
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Listing deleted'); fetchMyListings() }
      else toast.error('Failed to delete listing')
    } catch { toast.error('Failed to delete listing') }
  }

  const updateAvailability = async (listingId: string, availability_status: AvailabilityStatus) => {
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability_status }),
      })
      if (res.ok) {
        toast.success('Updated!')
        setMyListings(prev => prev.map(l => l.id === listingId ? { ...l, availability_status } : l))
      } else toast.error('Failed to update')
    } catch { toast.error('Failed to update') }
  }

  const updateRequestStatus = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(status === 'accepted' ? 'Request accepted!' : 'Request declined')
        fetchIncomingRequests()
      } else toast.error('Failed to update request')
    } catch { toast.error('Failed to update request') }
  }

  const confirmSchedule = async (requestId: string, proposedTime: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_time: proposedTime }),
      })
      if (res.ok) { toast.success('Pickup time confirmed!'); fetchIncomingRequests() }
      else toast.error('Failed to confirm time')
    } catch { toast.error('Failed') }
  }

  const counterSchedule = async (requestId: string) => {
    const time = counterTime[requestId]
    if (!time) return
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposed_time: time, schedule_status: 'countered' }),
      })
      if (res.ok) {
        toast.success('Counter-proposal sent!')
        setShowCounter(p => ({ ...p, [requestId]: false }))
        fetchIncomingRequests()
      } else toast.error('Failed')
    } catch { toast.error('Failed') }
  }

  const submitReview = async (requestId: string, rateeId: string) => {
    const rf = reviewForm[requestId]
    if (!rf || rf.stars === 0) { toast.error('Please select a star rating'); return }
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup_request_id: requestId, ratee_id: rateeId, stars: rf.stars, review: rf.text }),
      })
      if (res.ok) {
        toast.success('Review submitted!')
        setReviewForm(p => ({ ...p, [requestId]: { ...p[requestId], open: false } }))
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed')
      }
    } catch { toast.error('Failed to submit review') }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      expired: 'bg-gray-100 text-gray-600',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!user) return null

  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user.email}</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {(['listings', 'requests', 'incoming', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 font-semibold border-b-2 transition-colors flex items-center gap-2 text-sm whitespace-nowrap ${
                  activeTab === tab ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'listings' && 'My Listings'}
                {tab === 'requests' && 'My Requests'}
                {tab === 'incoming' && (
                  <>
                    Incoming Requests
                    {pendingIncoming > 0 && (
                      <span className="bg-orange-600 text-white text-xs rounded-full px-2 py-0.5">{pendingIncoming}</span>
                    )}
                  </>
                )}
                {tab === 'history' && 'History'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : activeTab === 'listings' ? (
          myListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <div className="text-6xl mb-4">🌳</div>
              <p className="text-gray-600 mb-4">No listings yet</p>
              <Link href="/listings/new" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map(listing => (
                <div key={listing.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{FRUIT_EMOJIS[listing.fruit_type] || '🍊'}</span>
                      <h3 className="text-lg font-bold text-gray-900">{listing.fruit_type}</h3>
                    </div>
                    {getStatusBadge(listing.status)}
                  </div>
                  <p className="text-gray-500 text-sm mb-1"><span className="font-medium text-gray-700">Qty:</span> {listing.quantity}</p>
                  <p className="text-gray-400 text-xs mb-1">
                    {new Date(listing.available_start).toLocaleDateString()} – {new Date(listing.available_end).toLocaleDateString()}
                  </p>
                  {(() => {
                    const daysLeft = Math.ceil((new Date(listing.available_end).getTime() - Date.now()) / 86400000)
                    if (daysLeft < 0) return <p className="text-xs text-red-500 font-semibold mb-2">⚠️ Expired — consider removing or updating</p>
                    if (daysLeft <= 3) return <p className="text-xs text-orange-500 font-semibold mb-2">⏰ Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                    return null
                  })()}
                  {/* Availability status picker */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Availability</label>
                    <select
                      value={listing.availability_status || 'available'}
                      onChange={e => updateAvailability(listing.id, e.target.value as AvailabilityStatus)}
                      className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {AVAILABILITY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => deleteListing(listing.id)}
                    className="w-full text-red-600 hover:bg-red-50 font-medium py-2 px-4 border border-red-200 rounded-lg transition-colors text-sm"
                  >
                    Delete Listing
                  </button>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'requests' ? (
          myRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-gray-600 mb-4">No requests yet</p>
              <Link href="/map" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                Find Fruit Near You
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map(request => (
                <div key={request.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{FRUIT_EMOJIS[request.listings.fruit_type] || '🍊'}</span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{request.listings.fruit_type}</h3>
                        <p className="text-sm text-gray-500">{request.listings.city}, {request.listings.state}</p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  {request.message && (
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Message:</span> {request.message}</p>
                  )}
                  {/* Schedule status */}
                  {request.confirmed_time && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-sm text-green-800">
                      ✓ Pickup confirmed for {new Date(request.confirmed_time).toLocaleString()}
                    </div>
                  )}
                  {!request.confirmed_time && request.proposed_time && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-sm text-blue-800">
                      🕐 {request.schedule_status === 'countered' ? 'Owner proposed' : 'You proposed'}: {new Date(request.proposed_time).toLocaleString()}
                    </div>
                  )}
                  {request.status === 'accepted' && request.listings.full_address && (
                    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-semibold text-green-900 mb-1">✓ Accepted!</p>
                      <p className="text-sm text-green-800"><span className="font-medium">Address:</span> {request.listings.full_address}</p>
                      <Link href="/messages" className="inline-block mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
                        Open Messages →
                      </Link>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3">Requested {new Date(request.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'incoming' ? (
          incomingRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <div className="text-6xl mb-4">📬</div>
              <p className="text-gray-600">No incoming requests yet</p>
              <p className="text-sm text-gray-400 mt-2">When neighbors request your fruit, they'll appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map(request => {
                const requesterName = request.users?.display_name || request.users?.email?.split('@')[0] || 'Neighbor'
                return (
                  <div key={request.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{FRUIT_EMOJIS[request.listings.fruit_type] || '🍊'}</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{request.listings.fruit_type}</h3>
                          <p className="text-sm text-gray-500">
                            Requested by <Link href={`/profile/${request.requester_id}`} className="text-orange-600 hover:underline">{requesterName}</Link>
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.message && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700 italic">"{request.message}"</p>
                      </div>
                    )}
                    {/* Scheduling */}
                    {request.proposed_time && !request.confirmed_time && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-800 mb-2">
                          🕐 Proposed pickup: <strong>{new Date(request.proposed_time).toLocaleString()}</strong>
                        </p>
                        {request.status === 'accepted' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmSchedule(request.id, request.proposed_time!)}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Confirm Time
                            </button>
                            <button
                              onClick={() => setShowCounter(p => ({ ...p, [request.id]: !p[request.id] }))}
                              className="text-xs border border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Counter-propose
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {request.confirmed_time && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-sm text-green-800">
                        ✓ Pickup confirmed for {new Date(request.confirmed_time).toLocaleString()}
                      </div>
                    )}
                    {showCounter[request.id] && (
                      <div className="mb-3 flex gap-2">
                        <input
                          type="datetime-local"
                          value={counterTime[request.id] || ''}
                          onChange={e => setCounterTime(p => ({ ...p, [request.id]: e.target.value }))}
                          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => counterSchedule(request.id)}
                          className="text-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 rounded-lg transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mb-3">Requested {new Date(request.created_at).toLocaleDateString()}</p>
                    {request.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => updateRequestStatus(request.id, 'accepted')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => updateRequestStatus(request.id, 'declined')}
                          className="flex-1 text-red-600 hover:bg-red-50 font-semibold py-2 px-4 border border-red-200 rounded-lg transition-colors text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {request.status === 'accepted' && (
                      <Link href="/messages" className="block w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium mt-2">
                        Open Messages →
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* History tab */
          history.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <div className="text-6xl mb-4">📜</div>
              <p className="text-gray-600">No completed or past requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(request => {
                const rf = reviewForm[request.id] || { stars: 0, text: '', open: false }
                const listingUserId = request.listings?.user_id
                return (
                  <div key={request.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{FRUIT_EMOJIS[request.listings.fruit_type] || '🍊'}</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{request.listings.fruit_type}</h3>
                          <p className="text-sm text-gray-500">{request.listings.city}, {request.listings.state}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.confirmed_time && (
                      <p className="text-sm text-gray-500 mb-2">
                        Pickup was {new Date(request.confirmed_time).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mb-3">{new Date(request.created_at).toLocaleDateString()}</p>
                    {/* Review section for completed pickups */}
                    {request.status === 'completed' && listingUserId && (
                      rf.open ? (
                        <div className="border-t pt-4 space-y-3">
                          <p className="text-sm font-medium text-gray-700">Leave a review for the owner:</p>
                          <StarPicker value={rf.stars} onChange={n => setReviewForm(p => ({ ...p, [request.id]: { ...rf, stars: n } }))} />
                          <textarea
                            value={rf.text}
                            onChange={e => setReviewForm(p => ({ ...p, [request.id]: { ...rf, text: e.target.value } }))}
                            rows={2}
                            placeholder="Optional comment..."
                            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitReview(request.id, listingUserId)}
                              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                            >
                              Submit Review
                            </button>
                            <button
                              onClick={() => setReviewForm(p => ({ ...p, [request.id]: { ...rf, open: false } }))}
                              className="text-sm text-gray-500 hover:text-gray-700 px-3"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewForm(p => ({ ...p, [request.id]: { stars: 0, text: '', open: true } }))}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium border-t pt-3 w-full text-left"
                        >
                          ★ Leave a review
                        </button>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
