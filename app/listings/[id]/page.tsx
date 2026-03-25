'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { FRUIT_EMOJIS } from '@/lib/utils'
import Nav from '@/components/Nav'

interface Listing {
  id: string
  user_id: string
  fruit_type: string
  quantity: string
  description: string | null
  city: string
  state: string
  approximate_lat: number
  approximate_lng: number
  available_start: string
  available_end: string
  pickup_notes: string | null
  status: string
  availability_status: 'available' | 'almost_gone' | 'picked_clean'
}

const AVAILABILITY_LABELS = {
  available: { label: 'Available', cls: 'bg-green-100 text-green-800' },
  almost_gone: { label: 'Almost Gone', cls: 'bg-yellow-100 text-yellow-800' },
  picked_clean: { label: 'Picked Clean', cls: 'bg-red-100 text-red-800' },
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState('I would like to pick up this fruit!')
  const [proposedTime, setProposedTime] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [waitlist, setWaitlist] = useState<{ count: number; on_waitlist: boolean; position: number | null }>({ count: 0, on_waitlist: false, position: null })
  const [waitlistLoading, setWaitlistLoading] = useState(false)

  useEffect(() => {
    checkAuth()
    if (params.id) fetchListing()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      setCheckingAuth(false)
    })
    return () => { subscription.unsubscribe() }
  }, [params.id])

  useEffect(() => {
    if (params.id) fetchWaitlist()
  }, [params.id, user])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
    }
    setCheckingAuth(false)
  }

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${params.id}`)
      if (res.ok) {
        setListing(await res.json())
      } else {
        toast.error('Listing not found')
        router.push('/map')
      }
    } catch {
      toast.error('Failed to load listing')
      router.push('/map')
    } finally {
      setLoading(false)
    }
  }

  const fetchWaitlist = async () => {
    try {
      const res = await fetch(`/api/waitlist?listing_id=${params.id}`)
      if (res.ok) setWaitlist(await res.json())
    } catch {}
  }

  const handleRequestPickup = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user && !user) {
      toast.error('Please sign in to request pickup')
      router.push('/login')
      return
    }

    setRequesting(true)
    try {
      const res = await fetch(`/api/listings/${params.id}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, proposed_time: proposedTime || undefined }),
      })

      if (res.ok) {
        toast.success('Pickup request sent! Check Messages to chat with the owner.')
        router.push('/messages')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to send request')
      }
    } catch {
      toast.error('Failed to send request')
    } finally {
      setRequesting(false)
    }
  }

  const handleJoinWaitlist = async () => {
    if (!user) { router.push('/login'); return }
    setWaitlistLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: params.id }),
      })
      if (res.ok) {
        toast.success('Added to waitlist!')
        fetchWaitlist()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed')
      }
    } catch {
      toast.error('Failed to join waitlist')
    } finally {
      setWaitlistLoading(false)
    }
  }

  const handleLeaveWaitlist = async () => {
    setWaitlistLoading(true)
    try {
      const res = await fetch(`/api/waitlist?listing_id=${params.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Removed from waitlist')
        fetchWaitlist()
      }
    } catch {
      toast.error('Failed')
    } finally {
      setWaitlistLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    )
  }

  if (!listing) return null

  const avStatus = AVAILABILITY_LABELS[listing.availability_status] || AVAILABILITY_LABELS.available
  const isPickedClean = listing.availability_status === 'picked_clean'
  const minDateTime = new Date().toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/map" className="text-orange-600 hover:text-orange-700 mb-4 inline-flex items-center text-sm">
          ← Back to Map
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8 mt-4">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <span className="text-6xl">{FRUIT_EMOJIS[listing.fruit_type] || '🍊'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">{listing.fruit_type}</h1>
                <span className={`text-sm px-3 py-1 rounded-full font-semibold ${avStatus.cls}`}>
                  {avStatus.label}
                </span>
              </div>
              <p className="text-gray-600 mt-1">Quantity: {listing.quantity}</p>
              <Link
                href={`/profile/${listing.user_id}`}
                className="text-sm text-orange-600 hover:text-orange-700 mt-1 inline-block"
              >
                View owner profile →
              </Link>
            </div>
          </div>

          {listing.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700">{listing.description}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Location</h2>
              <p className="text-gray-700">📍 {listing.city}, {listing.state}</p>
              <p className="text-sm text-orange-600 font-semibold mt-1">⚠️ Approximate location (±500m)</p>
              <p className="text-sm text-gray-500 mt-1">Exact address shared after request accepted</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Availability</h2>
              <p className="text-gray-700">
                📅 {new Date(listing.available_start).toLocaleDateString()} – {new Date(listing.available_end).toLocaleDateString()}
              </p>
            </div>
          </div>

          {listing.pickup_notes && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Pickup Instructions</h2>
              <p className="text-gray-700">{listing.pickup_notes}</p>
            </div>
          )}

          {/* Action area */}
          <div className="border-t pt-6">
            {checkingAuth ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto" />
              </div>
            ) : user ? (
              isPickedClean ? (
                /* Waitlist UI */
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                    This listing has been picked clean. {waitlist.count > 0 && `${waitlist.count} ${waitlist.count === 1 ? 'person is' : 'people are'} on the waitlist.`}
                  </div>
                  {waitlist.on_waitlist ? (
                    <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-800 font-medium">
                        You're #{waitlist.position} on the waitlist
                      </p>
                      <button
                        onClick={handleLeaveWaitlist}
                        disabled={waitlistLoading}
                        className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        Leave Waitlist
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoinWaitlist}
                      disabled={waitlistLoading}
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {waitlistLoading ? 'Joining...' : '📋 Join Waitlist'}
                    </button>
                  )}
                </div>
              ) : (
                /* Request Pickup UI */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message to owner</label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {showSchedule ? '− Hide scheduling' : '+ Propose a pickup time (optional)'}
                  </button>

                  {showSchedule && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proposed pickup time</label>
                      <input
                        type="datetime-local"
                        value={proposedTime}
                        min={minDateTime}
                        onChange={e => setProposedTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleRequestPickup}
                    disabled={requesting}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requesting ? 'Sending...' : '🍊 Request Pickup'}
                  </button>
                </div>
              )
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Sign in to request pickup</p>
                <Link
                  href="/login"
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
