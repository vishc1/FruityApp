'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Listing {
  id: string
  fruit_type: string
  quantity: string
  status: string
  created_at: string
  available_start: string
  available_end: string
}

interface Request {
  id: string
  status: string
  message: string | null
  created_at: string
  listings: {
    id: string
    fruit_type: string
    quantity: string
    city: string
    state: string
    full_address?: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'listings' | 'requests'>('listings')
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Check session on mount
    checkUser()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user)
        setLoading(false)
      } else {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      if (activeTab === 'listings') {
        fetchMyListings()
      } else {
        fetchMyRequests()
      }
    }
  }, [user, activeTab])

  const checkUser = async () => {
    const supabase = createClient()

    // First try to get the session
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      setUser(session.user)
      setLoading(false)
    } else {
      // If no session, try getUser as fallback
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setLoading(false)
      } else {
        // Wait a bit before redirecting in case session is still loading
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check one more time
        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (retrySession?.user) {
          setUser(retrySession.user)
          setLoading(false)
        } else {
          router.push('/login')
        }
      }
    }
  }

  const fetchMyListings = async () => {
    setLoading(true)
    const supabase = createClient()
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
    setLoading(true)
    try {
      const response = await fetch('/api/requests?type=outgoing')
      const data = await response.json()
      setMyRequests(data || [])
    } catch (error) {
      toast.error('Failed to load requests')
    }
    setLoading(false)
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Listing deleted')
        fetchMyListings()
      } else {
        toast.error('Failed to delete listing')
      }
    } catch (error) {
      toast.error('Failed to delete listing')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!user) return null

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
            <nav className="flex items-center gap-4">
              <Link href="/map" className="text-gray-700 hover:text-orange-600 font-medium">
                Find Fruit
              </Link>
              <Link href="/messages" className="text-gray-700 hover:text-orange-600 font-medium">
                Messages
              </Link>
              <Link
                href="/listings/new"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                + New Listing
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-gray-600 hover:text-gray-900 text-sm">
                  Sign Out
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.email}!</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('listings')}
              className={`pb-4 px-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'listings'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Listings
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-4 px-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Requests
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : activeTab === 'listings' ? (
          <div>
            {myListings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600 mb-4">You haven't created any listings yet</p>
                <Link
                  href="/listings/new"
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map(listing => (
                  <div key={listing.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{listing.fruit_type}</h3>
                      {getStatusBadge(listing.status)}
                    </div>
                    <p className="text-gray-600 mb-2">
                      <strong>Quantity:</strong> {listing.quantity}
                    </p>
                    <p className="text-gray-600 mb-4">
                      <strong>Available:</strong> {new Date(listing.available_start).toLocaleDateString()} -{' '}
                      {new Date(listing.available_end).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="flex-1 text-red-600 hover:text-red-700 font-semibold py-2 px-4 border border-red-600 rounded-lg transition-colors"
                      >
                        Delete
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
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600 mb-4">You haven't requested any fruit yet</p>
                <Link
                  href="/map"
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Find Fruit Near You
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{request.listings.fruit_type}</h3>
                        <p className="text-sm text-gray-600">
                          {request.listings.city}, {request.listings.state}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-gray-600 mb-2">
                      <strong>Quantity:</strong> {request.listings.quantity}
                    </p>
                    {request.message && (
                      <p className="text-gray-600 mb-2">
                        <strong>Your message:</strong> {request.message}
                      </p>
                    )}
                    {request.status === 'accepted' && request.listings.full_address && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-semibold text-green-900 mb-1">✓ Request Accepted!</p>
                        <p className="text-sm text-green-800">
                          <strong>Address:</strong> {request.listings.full_address}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-4">
                      Requested on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
