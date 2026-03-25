'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FRUIT_EMOJIS } from '@/lib/utils'
import Nav from '@/components/Nav'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  display_name: string | null
  member_since: string
  listings_count: number
  pickups_given: number
  avg_rating: number | null
  rating_count: number
}

interface Review {
  stars: number
  review: string | null
  created_at: string
  users: { display_name: string | null; email: string }
}

interface ListingItem {
  id: string
  fruit_type: string
  quantity: string
  city: string
  state: string
  status: string
  availability_status: string
}

function StarRow({ avg, count }: { avg: number | null; count: number }) {
  if (!avg) return <span className="text-gray-400 text-sm">No ratings yet</span>
  const full = Math.floor(avg)
  return (
    <div className="flex items-center gap-2">
      <span className="text-yellow-400 text-lg">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span className="text-gray-700 font-semibold">{avg}</span>
      <span className="text-gray-400 text-sm">({count} {count === 1 ? 'review' : 'reviews'})</span>
    </div>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const profileId = params.id as string
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [listings, setListings] = useState<ListingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [profileId])

  const fetchProfile = async () => {
    try {
      const [profileRes, ratingsRes, listingsRes] = await Promise.all([
        fetch(`/api/profile/${profileId}`),
        fetch(`/api/ratings?user_id=${profileId}`),
        fetch(`/api/listings?user_id=${profileId}`),
      ])
      if (profileRes.ok) setProfile(await profileRes.json())
      if (ratingsRes.ok) {
        const data = await ratingsRes.json()
        setReviews(data.reviews || [])
      }
      if (listingsRes.ok) setListings(await listingsRes.json())
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profile not found</p>
          <Link href="/map" className="text-orange-600 hover:text-orange-700">Back to Map</Link>
        </div>
      </div>
    )
  }

  const memberYear = new Date(profile.member_since).getFullYear()
  const reviewerName = (r: Review) => r.users?.display_name || r.users?.email?.split('@')[0] || 'Neighbor'

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-4xl shrink-0">
              🌳
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
              <p className="text-gray-500 text-sm mb-3">Member since {memberYear}</p>
              <StarRow avg={profile.avg_rating} count={profile.rating_count} />
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{profile.listings_count}</p>
                  <p className="text-xs text-gray-500">Active listings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{profile.pickups_given}</p>
                  <p className="text-xs text-gray-500">Pickups given</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        {listings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Their Fruit</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {listings.map(l => (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow flex items-center gap-3"
                >
                  <span className="text-2xl">{FRUIT_EMOJIS[l.fruit_type] || '🍊'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{l.fruit_type}</p>
                    <p className="text-sm text-gray-500">{l.city}, {l.state}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    l.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                    l.availability_status === 'almost_gone' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {l.availability_status === 'available' ? 'Available' :
                     l.availability_status === 'almost_gone' ? 'Almost Gone' : 'Picked Clean'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl shadow">
              <p className="text-gray-500">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                    <span className="text-sm text-gray-500">by {reviewerName(r)}</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.review && <p className="text-gray-700 italic">"{r.review}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
