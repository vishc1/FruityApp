'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Listing {
  id: string
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
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    if (params.id) {
      fetchListing()
    }

    // Subscribe to auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setCheckingAuth(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [params.id])

  const checkAuth = async () => {
    const supabase = createClient()

    // First try to get the session
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      setUser(session.user)
      setCheckingAuth(false)
    } else {
      // If no session, try getUser as fallback
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      }
      setCheckingAuth(false)
    }
  }

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setListing(data)
      } else {
        toast.error('Failed to load listing')
        router.push('/map')
      }
    } catch (error) {
      toast.error('Failed to load listing')
      router.push('/map')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPickup = async () => {
    // Double-check auth before making the request
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user && !user) {
      toast.error('Please sign in to request pickup')
      router.push('/login')
      return
    }

    setRequesting(true)
    try {
      const response = await fetch(`/api/listings/${params.id}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I would like to pick up this fruit!',
        }),
      })

      if (response.ok) {
        toast.success('Pickup request sent! Check the Messages page to chat with the owner.')
        router.push('/messages')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send request')
      }
    } catch (error) {
      toast.error('Failed to send request')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing not found</h1>
          <Link href="/map" className="text-orange-600 hover:text-orange-700">
            Back to Map
          </Link>
        </div>
      </div>
    )
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
            <div className="flex gap-4">
              <Link href="/map" className="text-gray-700 hover:text-orange-600 font-medium">
                Map
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-orange-600 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/messages" className="text-gray-700 hover:text-orange-600 font-medium">
                    Messages
                  </Link>
                </>
              ) : (
                <Link href="/login" className="text-gray-700 hover:text-orange-600 font-medium">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/map" className="text-orange-600 hover:text-orange-700 mb-4 inline-flex items-center">
          ← Back to Map
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8 mt-4">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl">🍊</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{listing.fruit_type}</h1>
              <p className="text-gray-600">Quantity: {listing.quantity}</p>
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
              <p className="text-sm text-orange-600 font-semibold mt-1">
                ⚠️ Approximate location (±500m)
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Exact address will be shared after your pickup request is accepted
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Availability</h2>
              <p className="text-gray-700">
                📅 {new Date(listing.available_start).toLocaleDateString()} - {new Date(listing.available_end).toLocaleDateString()}
              </p>
            </div>
          </div>

          {listing.pickup_notes && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Pickup Instructions</h2>
              <p className="text-gray-700">{listing.pickup_notes}</p>
            </div>
          )}

          <div className="border-t pt-6">
            {checkingAuth ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Checking authentication...</p>
              </div>
            ) : user ? (
              <button
                onClick={handleRequestPickup}
                disabled={requesting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requesting ? 'Sending Request...' : '🍊 Request Pickup'}
              </button>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Sign in to request pickup</p>
                <Link
                  href="/login"
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
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
