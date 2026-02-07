# 🍊 Fruity - Quick Reference Card

## 📍 Your App Is Here
```
/Users/vishwesh/Fruity/fruity-app/
```

## 🚀 Get It Running (3 Commands)

```bash
# 1. Go to app directory
cd /Users/vishwesh/Fruity/fruity-app

# 2. Create .env.local file (see below)

# 3. Run the app
npm run dev
```

**Then open: http://localhost:3000**

---

## 📝 Create .env.local File

Create a file called `.env.local` in the fruity-app folder with:

```env
# Get from supabase.com (create project → settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Get from mapbox.com (free account → access tokens)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# Keep this as-is
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Database Setup (One Time Only)

1. Go to supabase.com
2. Create new project
3. Go to SQL Editor
4. Copy SQL from SETUP_INSTRUCTIONS.md Step 1.2
5. Run it

---

## ✅ What's Working

- ✅ Landing page
- ✅ Login (magic link)
- ✅ Create listings
- ✅ Browse map
- ✅ Dashboard
- ✅ Pickup requests
- ✅ Privacy protection

---

## 📁 Key Files

```
app/
├── page.tsx              → Landing page
├── login/page.tsx        → Login
├── map/page.tsx          → Browse fruit
├── dashboard/page.tsx    → User dashboard
├── listings/new/page.tsx → Create listing
└── api/                  → Backend APIs

lib/
├── supabase/             → Database
├── geocoding.ts          → Address fuzzing
└── types/database.ts     → TypeScript types
```

---

## 🧪 Test It

1. Sign in with your email
2. Click "Share Your Fruit"
3. Create a listing
4. Go to Map → See your listing
5. Check Dashboard → Manage listings

---

## 🆘 Troubleshooting

**"Module not found"**
→ Run `npm install`

**"Can't connect to Supabase"**
→ Check `.env.local` has correct keys

**"Failed to geocode"**
→ Check Mapbox token

**"RLS policy violation"**
→ Run the SQL from SETUP_INSTRUCTIONS.md

---

## 📖 Full Docs

- **SETUP_INSTRUCTIONS.md** → Complete setup guide
- **DESIGN.md** → System architecture
- **README.md** → Overview

---

## 🎯 Your Localhost Link

**http://localhost:3000**

That's it! You're ready to go! 🚀
