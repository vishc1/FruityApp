# Fruity App - Setup Instructions

## 🚀 Quick Start (Get Running in 15 Minutes!)

Follow these steps to get the app running on `http://localhost:3000`

---

## Step 1: Set Up Supabase (5 minutes)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - Name: `fruity`
   - Database Password: (create a strong password and save it!)
   - Region: Choose closest to you
4. Click "Create new project" and wait 2 minutes

### 1.2 Set Up Database Tables
1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy and paste this entire SQL script:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  fruit_type TEXT NOT NULL,
  quantity TEXT NOT NULL,
  description TEXT,
  full_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  approximate_lat DECIMAL(10, 8) NOT NULL,
  approximate_lng DECIMAL(11, 8) NOT NULL,
  available_start DATE NOT NULL,
  available_end DATE NOT NULL,
  pickup_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pickup requests table
CREATE TABLE pickup_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, requester_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pickup_request_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_location ON listings(approximate_lat, approximate_lng);
CREATE INDEX idx_pickup_requests_listing_id ON pickup_requests(listing_id);
CREATE INDEX idx_pickup_requests_requester_id ON pickup_requests(requester_id);
CREATE INDEX idx_messages_request_id ON messages(pickup_request_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pickup_requests_updated_at BEFORE UPDATE ON pickup_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can insert own listings" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings" ON listings FOR DELETE USING (auth.uid() = user_id);

-- Pickup requests policies
CREATE POLICY "Users can view own requests" ON pickup_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR
    auth.uid() IN (SELECT user_id FROM listings WHERE id = listing_id)
  );
CREATE POLICY "Users can create requests" ON pickup_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own requests" ON pickup_requests
  FOR UPDATE USING (
    auth.uid() = requester_id OR
    auth.uid() IN (SELECT user_id FROM listings WHERE id = listing_id)
  );
CREATE POLICY "Users can delete own requests" ON pickup_requests FOR DELETE USING (auth.uid() = requester_id);

-- Messages policies
CREATE POLICY "Users can view relevant messages" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT requester_id FROM pickup_requests WHERE id = pickup_request_id
      UNION
      SELECT user_id FROM listings WHERE id = (SELECT listing_id FROM pickup_requests WHERE id = pickup_request_id)
    )
  );
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT requester_id FROM pickup_requests WHERE id = pickup_request_id
      UNION
      SELECT user_id FROM listings WHERE id = (SELECT listing_id FROM pickup_requests WHERE id = pickup_request_id)
    )
  );
```

4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

### 1.3 Configure Authentication
1. Click "Authentication" in left sidebar
2. Click "Providers"
3. Find "Email" provider and ensure it's enabled
4. Toggle ON "Enable Email provider"
5. Toggle ON "Confirm email" = OFF (for development)
6. Click "Save"

### 1.4 Get API Keys
1. Click "Project Settings" (gear icon in left sidebar)
2. Click "API"
3. Copy these values (you'll need them in Step 2):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

---

## Step 2: Set Up Mapbox (2 minutes)

1. Go to [mapbox.com](https://account.mapbox.com/)
2. Sign up or log in
3. Go to "Access Tokens" page
4. Copy your **Default public token** (starts with `pk.`)

---

## Step 3: Configure Environment Variables (1 minute)

1. In the `fruity-app` folder, create a file called `.env.local`
2. Copy and paste this, replacing with your actual keys:

```env
# Supabase (from Step 1.4)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your_long_key_here

# Mapbox (from Step 2)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...your_mapbox_token_here

# App URL (keep as is for local development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file

---

## Step 4: Install Dependencies & Run (2 minutes)

Open your terminal in the `fruity-app` folder and run:

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

You should see:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
```

---

## Step 5: Open the App! 🎉

Open your browser and go to: **http://localhost:3000**

You should see the Fruity homepage!

---

## 🧪 Testing the App

### Test Authentication:
1. Click "Sign In"
2. Enter your email
3. Check your email inbox for the magic link
4. Click the link → You'll be logged in!

### Test Creating a Listing:
1. After logging in, click "Share Your Fruit"
2. Fill out the form with:
   - Fruit type: Oranges
   - Quantity: A few bags
   - Address: (use a real address for geocoding to work)
   - Dates: Select date range
3. Click "Create Listing"
4. You should see it in your dashboard!

### Test Map View:
1. Click "Find Fruit" or go to `/map`
2. You should see your listing
3. Notice the location is approximate (fuzzy)

---

## 🔧 Troubleshooting

### Error: "Failed to geocode address"
- **Solution**: Check that your Mapbox token is correct in `.env.local`
- Make sure the token starts with `pk.`
- Restart the dev server after changing `.env.local`

### Error: "Unauthorized" or RLS errors
- **Solution**: Make sure you ran ALL the SQL in Step 1.2
- Check that RLS policies were created (go to Supabase → Authentication → Policies)

### Magic link email not arriving
- **Solution**: Check spam folder
- In Supabase, go to Authentication → Email Templates to customize
- For development, check Supabase logs for the magic link URL

### Port 3000 already in use
- **Solution**: Kill the process or use a different port:
```bash
npm run dev -- -p 3001
```

### Can't see listings on map
- **Solution**: Make sure you created at least one listing while logged in
- Check the Network tab in browser dev tools for API errors
- Verify listings exist in Supabase → Table Editor → listings

---

## 📁 Project Structure

```
fruity-app/
├── app/
│   ├── api/              # API routes
│   │   ├── listings/     # Listing endpoints
│   │   └── requests/     # Pickup request endpoints
│   ├── auth/             # Auth callbacks
│   ├── dashboard/        # User dashboard (TODO)
│   ├── login/            # Login page
│   ├── map/              # Map view
│   ├── listings/new/     # Create listing (TODO)
│   └── page.tsx          # Landing page
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── types/            # TypeScript types
│   ├── geocoding.ts      # Geocoding utilities
│   └── utils.ts          # Helper functions
└── middleware.ts         # Auth middleware
```

---

## 🚧 What's Missing (To Complete the MVP)

The core infrastructure is built, but you need to create these pages:

### 1. Dashboard Page (`app/dashboard/page.tsx`)
- Shows user's listings
- Shows pickup requests (incoming and outgoing)
- Accept/decline requests

### 2. Create Listing Page (`app/listings/new/page.tsx`)
- Form to create new listings
- Address input with autocomplete
- Date picker for availability

### 3. Request Detail Page (`app/requests/[id]/page.tsx`)
- View request details
- See full address (if accepted)
- In-app messaging

### 4. Profile Page (`app/profile/page.tsx`)
- Edit display name and phone

---

## 📚 Next Steps

1. **Add Remaining Pages**: Create the dashboard and listing pages
2. **Add Real Map**: Integrate Mapbox GL JS for interactive map
3. **Add Photos**: Allow users to upload fruit photos
4. **Email Notifications**: Send emails when requests are accepted
5. **Mobile Polish**: Improve mobile responsiveness

---

## 🆘 Need Help?

- Check the full design docs: `DESIGN.md` and `IMPLEMENTATION_GUIDE.md`
- Review the code comments in each file
- Check Supabase logs for backend errors
- Check browser console for frontend errors

---

## 🎉 Success!

If you can see the landing page and login, you're 70% done!

The core auth, database, and API are working. Now just add the remaining UI pages and you'll have a complete MVP.

**Your localhost link:** http://localhost:3000

Happy coding! 🍊
