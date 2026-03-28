-- Safe migration: adds all columns only if they don't already exist
-- Run this in Supabase SQL editor

-- Listings: availability status
ALTER TABLE listings ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';

-- Listings: lat/lng (exact, private)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude FLOAT8;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Listings: approximate coords (public, fuzzy)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS approximate_lat FLOAT8;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS approximate_lng FLOAT8;

-- Pickup requests: scheduling
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS proposed_time TIMESTAMPTZ;
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS confirmed_time TIMESTAMPTZ;
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS schedule_status TEXT DEFAULT 'unscheduled';

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_request_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ratee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pickup_request_id, rater_id)
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  city TEXT,
  state TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (safe: won't error if already exist due to IF NOT EXISTS)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ratings' AND policyname='ratings_select') THEN
    CREATE POLICY ratings_select ON ratings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ratings' AND policyname='ratings_insert') THEN
    CREATE POLICY ratings_insert ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist_entries' AND policyname='waitlist_select') THEN
    CREATE POLICY waitlist_select ON waitlist_entries FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist_entries' AND policyname='waitlist_insert') THEN
    CREATE POLICY waitlist_insert ON waitlist_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist_entries' AND policyname='waitlist_delete') THEN
    CREATE POLICY waitlist_delete ON waitlist_entries FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='announcements_select') THEN
    CREATE POLICY announcements_select ON announcements FOR SELECT USING (is_deleted = false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='announcements_insert') THEN
    CREATE POLICY announcements_insert ON announcements FOR INSERT WITH CHECK (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='announcements_update') THEN
    CREATE POLICY announcements_update ON announcements FOR UPDATE USING (auth.uid() = author_id);
  END IF;
END $$;

