'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FRUIT_TYPES, QUANTITY_OPTIONS } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Property } from '@/lib/types/database'

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingProperty, setLoadingProperty] = useState(true)
  const [property, setProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState({
    fruit_type: '',
    quantity: '',
    description: '',
    full_address: '',
    available_start: '',
    available_end: '',
    pickup_notes: ''
  })

  useEffect(() => {
    fetchProperty()
  }, [])

  const fetchProperty = async () => {
    try {
      const response = await fetch('/api/property')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setProperty(data)
          setFormData(prev => ({
            ...prev,
            full_address: data.address
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching property:', error)
    } finally {
      setLoadingProperty(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate property is set up
    if (!property || !formData.full_address) {
      toast.error('Please set up your property first before creating a listing.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create listing')
      }

      toast.success('Listing created successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🍊</span>
            <h1 className="text-xl font-bold text-orange-600">Fruity</h1>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Fruit</h1>
          <p className="text-gray-600">List your extra fruit for free pickup by neighbors</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Fruit Type */}
          <div>
            <label htmlFor="fruit_type" className="block text-sm font-medium text-gray-700 mb-2">
              Fruit Type *
            </label>
            <select
              id="fruit_type"
              name="fruit_type"
              value={formData.fruit_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select fruit type...</option>
              {FRUIT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <select
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select quantity...</option>
              {QUANTITY_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., Sweet Valencia oranges, great for juicing"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="full_address" className="block text-sm font-medium text-gray-700 mb-2">
              Property Address *
            </label>
            {loadingProperty ? (
              <div className="flex items-center gap-2 text-gray-600 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                Loading your property...
              </div>
            ) : property ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏡</span>
                  <div>
                    <p className="font-semibold text-green-900">{property.address}</p>
                    <p className="text-sm text-green-700 mt-1">
                      ✓ Using your verified property
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-3">
                  You haven't set up your property yet. You need to verify your property location first.
                </p>
                <Link
                  href="/property/setup"
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Set Up My Property
                </Link>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              🔒 Your exact address is kept private. Only an approximate location will be shown on the map.
            </p>
          </div>

          {/* Available Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="available_start" className="block text-sm font-medium text-gray-700 mb-2">
                Available From *
              </label>
              <input
                type="date"
                id="available_start"
                name="available_start"
                value={formData.available_start}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="available_end" className="block text-sm font-medium text-gray-700 mb-2">
                Available Until *
              </label>
              <input
                type="date"
                id="available_end"
                name="available_end"
                value={formData.available_end}
                onChange={handleChange}
                required
                min={formData.available_start || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Pickup Notes */}
          <div>
            <label htmlFor="pickup_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Instructions (optional)
            </label>
            <textarea
              id="pickup_notes"
              name="pickup_notes"
              value={formData.pickup_notes}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., Front yard tree, help yourself anytime OR Please message me to arrange pickup time"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Privacy & Safety</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Your exact address is NOT shown publicly</li>
              <li>✓ Only approximate location appears on the map (±500 meters)</li>
              <li>✓ Full address is revealed only after you accept a pickup request</li>
              <li>✓ You can decline any request</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
