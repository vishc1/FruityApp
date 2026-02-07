# 🍊 Fruity - Community Fruit Sharing Platform

A Next.js web application that connects neighbors to share excess fruit from their yards. Built with privacy-first features and real-time messaging.

## Features

- 🔐 **Secure Authentication** - Email-based authentication via Supabase
- 📍 **GPS Property Verification** - Verify property ownership within 50 meters
- 🗺️ **Interactive Map** - Leaflet/OpenStreetMap integration (no API key needed)
- 💬 **Real-time Messaging** - Chat between fruit givers and receivers
- 🏡 **Privacy Protection** - Address fuzzing (±500m) for public listings
- 🍎 **Easy Listing Management** - Create, edit, and manage fruit listings
- 📱 **Mobile Responsive** - Works on all devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Maps**: Leaflet + React-Leaflet (OpenStreetMap)
- **Geocoding**: Nominatim (free, no API key)
- **Styling**: Tailwind CSS
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd fruity-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 4. Run Database Setup

1. Open your Supabase project
2. Go to SQL Editor
3. Run the SQL from `DATABASE_SETUP.sql`
4. Run the SQL from `DATABASE_MIGRATION_ADD_COLUMNS.sql`

### 5. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_APP_URL` = your production URL
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click "Deploy"

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts and add environment variables when asked
```

### Post-Deployment

1. Update your Supabase allowed redirect URLs:
   - Go to Authentication > URL Configuration
   - Add your Vercel URL: `https://your-app.vercel.app/**`
2. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables to your production URL

## Database Schema

The app uses the following tables:

- **users** - User profiles with display names
- **properties** - Verified property locations
- **listings** - Fruit listings with fuzzy locations
- **pickup_requests** - Pickup requests between users
- **messages** - Chat messages for coordination

All tables have Row Level Security (RLS) policies for data protection.

## Privacy & Security

- Exact addresses are never shown publicly
- Listings use approximate coordinates (±500m)
- GPS verification required for property setup
- RLS policies protect user data
- Full address revealed only after pickup acceptance

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT

## Credits

Built with [Claude Code](https://claude.com/claude-code)
