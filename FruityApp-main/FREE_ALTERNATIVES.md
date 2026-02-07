# 🆓 100% Free Setup - No API Keys Needed!

You're right! We can use completely free alternatives:

## Option 1: Vercel Postgres (FREE Database)

Instead of Supabase, use Vercel's built-in Postgres database!

### Setup (3 minutes):

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Create Postgres database
vercel postgres create fruity-db

# Connect to your project
vercel env pull
```

This automatically:
- ✅ Creates a Postgres database
- ✅ Adds connection string to .env
- ✅ No signup or API keys needed
- ✅ 256 MB free (plenty for your app)

## Option 2: Leaflet Maps (FREE - No API Key!)

Instead of Mapbox, use Leaflet with OpenStreetMap!

### Why Leaflet?
- ✅ **100% free** - no API key needed
- ✅ Open source
- ✅ Address picking built-in
- ✅ Unlimited usage
- ✅ Works offline

### Install:

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### Example Map Component:

```tsx
'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'

export default function AddressPicker({ onLocationSelect }: {
  onLocationSelect: (lat: number, lng: number) => void
}) {
  const [position, setPosition] = useState<[number, number]>([37.7749, -122.4194])

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        onLocationSelect(lat, lng)
      },
    })
    return <Marker position={position} />
  }

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <LocationMarker />
    </MapContainer>
  )
}
```

### For Address Geocoding (also FREE):

Use Nominatim (OpenStreetMap's free geocoding):

```typescript
async function geocodeAddress(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FruityApp/1.0' // Required by Nominatim
    }
  })

  const data = await response.json()

  if (data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      address: data[0].display_name
    }
  }

  throw new Error('Address not found')
}
```

## Complete Free Stack:

| Need | Free Solution | Cost |
|------|---------------|------|
| **Database** | Vercel Postgres | $0 (256 MB free) |
| **Maps** | Leaflet + OpenStreetMap | $0 (unlimited) |
| **Geocoding** | Nominatim | $0 (1 req/sec limit) |
| **Hosting** | Vercel | $0 (hobby tier) |
| **Auth** | Simple JWT or Vercel KV | $0 |

**Total: $0** 🎉

---

## Quick Migration Steps:

### 1. Replace Mapbox with Leaflet

```bash
npm uninstall mapbox-gl
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### 2. Use Vercel Postgres

```bash
vercel postgres create fruity-db
vercel env pull
```

Your `.env.local` will automatically have:
```env
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
```

### 3. Update Database Connection

```typescript
import { sql } from '@vercel/postgres'

// Query example
const { rows } = await sql`SELECT * FROM listings WHERE status = 'active'`
```

---

## Want Me to Convert Your App?

I can:
1. ✅ Replace Mapbox with Leaflet maps
2. ✅ Replace Supabase with Vercel Postgres
3. ✅ Replace Mapbox geocoding with Nominatim
4. ✅ Remove all API key requirements

**Say "Convert to free stack" and I'll do it!**

---

## Pros & Cons:

### Vercel Postgres:
**Pros:**
- ✅ Built into Vercel
- ✅ No separate service
- ✅ Automatic connection setup
- ✅ 256 MB free forever

**Cons:**
- ❌ No built-in auth (need to add your own)
- ❌ No real-time subscriptions
- ❌ Need to write SQL manually

### Leaflet:
**Pros:**
- ✅ Completely free
- ✅ No API keys
- ✅ Unlimited usage
- ✅ Works offline
- ✅ Click to select location

**Cons:**
- ❌ Nominatim has rate limits (1 req/sec)
- ❌ Less fancy than Mapbox
- ❌ No built-in directions/routing

---

## Current Setup vs Free Setup:

| Feature | Current (Supabase/Mapbox) | Free (Vercel/Leaflet) |
|---------|---------------------------|----------------------|
| Database | Supabase (API keys) | Vercel Postgres (no keys) |
| Auth | Supabase Magic Links | Simple email/password or sessions |
| Maps | Mapbox (API key) | Leaflet (no key!) |
| Geocoding | Mapbox (API key) | Nominatim (no key!) |
| Cost | Free tier limits | Free forever |
| Setup | Need 2 signups | All in Vercel |

---

## My Recommendation:

**For hackathon/demo**: Use the free stack (Vercel Postgres + Leaflet)
**For production**: Current setup (Supabase + Mapbox) is more powerful

Want me to implement the free version? 🚀
