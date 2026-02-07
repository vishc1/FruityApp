'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

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
}

interface FruitMapProps {
  listings: Listing[]
  center?: [number, number]
  zoom?: number
}

export default function FruitMap({ listings, center = [37.7749, -122.4194], zoom = 10 }: FruitMapProps) {
  const [icon, setIcon] = useState<any>(null)

  // Create custom icon on client side only
  useEffect(() => {
    const L = require('leaflet')

    const customIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange" width="32" height="32">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })

    setIcon(customIcon)
  }, [])

  if (!icon) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border-2 border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {listings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.approximate_lat, listing.approximate_lng]}
            icon={icon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍊</span>
                  <h3 className="font-bold text-lg">{listing.fruit_type}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Quantity:</strong> {listing.quantity}
                </p>
                {listing.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {listing.description}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  📍 {listing.city}, {listing.state}
                </p>
                <p className="text-xs text-orange-600 font-semibold mt-1">
                  ⚠️ Approximate location (±500m)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📅 Available: {new Date(listing.available_start).toLocaleDateString()} - {new Date(listing.available_end).toLocaleDateString()}
                </p>
                <a
                  href={`/listings/${listing.id}`}
                  className="block mt-3 bg-orange-600 hover:bg-orange-700 text-white text-center py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                >
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
