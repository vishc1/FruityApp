import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import toast from 'react-hot-toast'
import { predictExpirationDays } from '../utils/predict'

interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  address: {
    road?: string
    house_number?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
  }
}

export default function NewListingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [expirationDays, setExpirationDays] = useState<number | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [formData, setFormData] = useState({
    fruitType: '',
    quantity: '',
    description: '',
    address: '',
    city: '',
    state: '',
    availableStart: '',
    availableEnd: '',
  })

  const getMyLocation = async () => {
    setGettingLocation(true)
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser')
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            // Get 3 nearby addresses around the user's location
            const nearbyAddresses: AddressSuggestion[] = []

            // Search in a small radius around the location (approximately 50 meters in each direction)
            const offsets = [
              { lat: 0, lon: 0 }, // Current location
              { lat: 0.0005, lon: 0 }, // ~50m north
              { lat: -0.0005, lon: 0 }, // ~50m south
            ]

            for (const offset of offsets) {
              const searchLat = latitude + offset.lat
              const searchLon = longitude + offset.lon

              const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${searchLat}&lon=${searchLon}&addressdetails=1`
              const response = await fetch(reverseUrl, {
                headers: { 'User-Agent': 'FruityApp/1.0' },
              })
              const result = await response.json()

              // Only add if it has proper address details
              if (result.address && (result.address.house_number || result.address.road)) {
                nearbyAddresses.push(result)
              }

              // Add small delay to respect API rate limits
              await new Promise(resolve => setTimeout(resolve, 200))
            }

            if (nearbyAddresses.length > 0) {
              setAddressSuggestions(nearbyAddresses.slice(0, 3))
              setShowSuggestions(true)
              toast.success(`Found ${nearbyAddresses.length} nearby address${nearbyAddresses.length > 1 ? 'es' : ''}! Select one below.`)
            } else {
              toast.error('Could not find nearby addresses. Please enter manually.')
            }
          } catch (error) {
            toast.error('Failed to get address suggestions')
            console.error(error)
          }
        },
        (error) => {
          toast.error('Unable to get your location. Please enable location services.')
          console.error(error)
        }
      )
    } finally {
      setGettingLocation(false)
    }
  }

  const selectAddress = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address
    const street = addr.house_number && addr.road
      ? `${addr.house_number} ${addr.road}`
      : addr.road || ''

    setFormData({
      ...formData,
      address: street,
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
    })
    setShowSuggestions(false)
    toast.success('Address selected!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to create a listing')
      return
    }

    setLoading(true)

    try {
      // Geocode the address using OpenStreetMap Nominatim (free, no API key needed)
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        `${formData.address}, ${formData.city}, ${formData.state}`
      )}`

      const geocodeResponse = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'FruityApp/1.0',
        },
      })

      const geocodeData = await geocodeResponse.json()

      if (!geocodeData || geocodeData.length === 0) {
        toast.error('Could not find address. Please check and try again.')
        setLoading(false)
        return
      }

      const { lat, lon } = geocodeData[0]

      // Upload image to Supabase Storage if present
      let imageUrl = null
      if (uploadedImage) {
        const fileExt = uploadedImage.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('fruit-images')
          .upload(fileName, uploadedImage)

        if (uploadError) {
          console.error('Image upload error:', uploadError)
          toast.error('Failed to upload image')
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('fruit-images')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      // Calculate expiration date if prediction was made
      let expirationDate = null
      if (expirationDays !== null) {
        const expDate = new Date()
        expDate.setDate(expDate.getDate() + expirationDays)
        expirationDate = expDate.toISOString()
      }

      // Create listing
      const { error } = await supabase.from('listings').insert({
        user_id: user.id,
        fruit_type: formData.fruitType,
        quantity: formData.quantity,
        description: formData.description || null,
        image_url: imageUrl,
        approximate_lat: parseFloat(lat),
        approximate_lng: parseFloat(lon),
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        city: formData.city,
        state: formData.state,
        full_address: `${formData.address}, ${formData.city}, ${formData.state}`,
        available_start: formData.availableStart,
        available_end: formData.availableEnd,
        expiration_date: expirationDate,
        status: 'active',
      })

      if (error) {
        toast.error(`Failed to create listing: ${error.message}`)
        console.error('Supabase error:', error)
      } else {
        toast.success('Listing created successfully!')
        navigate('/dashboard')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to create listing: ${errorMessage}`)
      console.error('Create listing error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setPredicting(true)

    try {
      const days = await predictExpirationDays(file)
      setExpirationDays(days)
    } catch (error) {
      console.error('Prediction error:', error)
      toast.error('Failed to predict expiration')
    } finally {
      setPredicting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please sign in to create a listing</p>
          <Link
            to="/login"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Sign In
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
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl">🍊</span>
              <h1 className="text-xl font-bold text-orange-600">Fruity</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-orange-600 font-medium">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Listing</h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fruitType" className="block text-sm font-medium text-gray-700 mb-2">
                Fruit Type
              </label>
              <select
                id="fruitType"
                name="fruitType"
                value={formData.fruitType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">Select a fruit type</option>
                <option value="Oranges">🍊 Oranges</option>
                <option value="Apples">🍎 Apples</option>
                <option value="Bananas">🍌 Bananas</option>
                <option value="Lemons">🍋 Lemons</option>
                <option value="Limes">🟢 Limes</option>
                <option value="Grapefruits">🟡 Grapefruits</option>
                <option value="Avocados">🥑 Avocados</option>
                <option value="Peaches">🍑 Peaches</option>
                <option value="Pears">🍐 Pears</option>
                <option value="Plums">🟣 Plums</option>
                <option value="Cherries">🍒 Cherries</option>
                <option value="Strawberries">🍓 Strawberries</option>
                <option value="Blueberries">🫐 Blueberries</option>
                <option value="Figs">🟤 Figs</option>
                <option value="Pomegranates">🟥 Pomegranates</option>
                <option value="Guavas">🟢 Guavas</option>
                <option value="Mangoes">🥭 Mangoes</option>
                <option value="Persimmons">🟠 Persimmons</option>
                <option value="Other">🍇 Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <select
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">Select quantity</option>
                <option value="A few (1-5 fruits)">A few (1-5 fruits)</option>
                <option value="A handful (5-10 fruits)">A handful (5-10 fruits)</option>
                <option value="A small bag (10-20 fruits)">A small bag (10-20 fruits)</option>
                <option value="A large bag (20-50 fruits)">A large bag (20-50 fruits)</option>
                <option value="A basket (50-100 fruits)">A basket (50-100 fruits)</option>
                <option value="Multiple baskets (100+ fruits)">Multiple baskets (100+ fruits)</option>
                <option value="About 5 lbs">About 5 lbs</option>
                <option value="About 10 lbs">About 10 lbs</option>
                <option value="About 25 lbs">About 25 lbs</option>
                <option value="About 50 lbs">About 50 lbs</option>
                <option value="About 100 lbs">About 100 lbs</option>
                <option value="More than 100 lbs">More than 100 lbs</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Any additional details about the fruit..."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="fruitImage" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Fruit Image (Optional)
              </label>
              <input
                type="file"
                id="fruitImage"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img src={imagePreview} alt="Preview" className="w-48 h-48 object-cover rounded-lg" />
                  {predicting && <p className="mt-2 text-sm text-gray-600">Analyzing...</p>}
                  {expirationDays !== null && !predicting && (
                    <p className="mt-2 text-sm font-semibold text-orange-600">
                      Expires in {expirationDays} days
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <button
                  type="button"
                  onClick={getMyLocation}
                  disabled={gettingLocation}
                  className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all disabled:opacity-50"
                >
                  {gettingLocation ? '📍 Getting location...' : '📍 Use My Location'}
                </button>
              </div>

              {/* Address Suggestions */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-lg">
                  <p className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    Select your address:
                  </p>
                  <div className="space-y-2">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectAddress(suggestion)}
                        className="w-full text-left p-3 bg-white hover:bg-blue-50 border-2 border-blue-100 hover:border-blue-300 rounded-lg transition-all shadow-sm hover:shadow-md"
                      >
                        <p className="font-semibold text-gray-900">{suggestion.display_name}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ✕ Close suggestions
                  </button>
                </div>
              )}

              <input
                id="address"
                name="address"
                type="text"
                placeholder="123 Main St"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="San Francisco"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="CA"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="availableStart" className="block text-sm font-medium text-gray-700 mb-2">
                  Available From
                </label>
                <input
                  id="availableStart"
                  name="availableStart"
                  type="date"
                  value={formData.availableStart}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="availableEnd" className="block text-sm font-medium text-gray-700 mb-2">
                  Available Until
                </label>
                <input
                  id="availableEnd"
                  name="availableEnd"
                  type="date"
                  value={formData.availableEnd}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
              <Link
                to="/dashboard"
                className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
