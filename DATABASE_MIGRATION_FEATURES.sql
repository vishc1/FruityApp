-- ============================================================
-- Fruity App — Feature Migration
-- Run this in your Supabase SQL Editor after the initial setup
-- ============================================================

-- 1. Availability status on listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS availability_status TEXT
    NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'almost_gone', 'picked_clean'));

-- 2. Pickup scheduling columns on requests
ALTER TABLE pickup_requests
  ADD COLUMN IF NOT EXISTS proposed_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS confirmed_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS schedule_status TEXT
    NOT NULL DEFAULT 'unscheduled'
    CHECK (schedule_status IN ('unscheduled', 'proposed', 'confirmed', 'countered'));

-- 3. Ratings / Reviews table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_request_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  ratee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pickup_request_id, rater_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select_all" ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_own" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);

-- 4. Waitlist table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlist_select" ON waitlist_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT user_id FROM listings WHERE id = listing_id)
  );
CREATE POLICY "waitlist_insert" ON waitlist_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "waitlist_delete" ON waitlist_entries FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_waitlist_listing_id ON waitlist_entries(listing_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON waitlist_entries(user_id);

-- 5. Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  city TEXT,
  state TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (is_deleted = false);
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "announcements_update" ON announcements FOR UPDATE USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
