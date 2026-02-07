-- Add house/property management to the database
-- Run this in your Supabase SQL Editor

-- Create properties table for user homes
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE, -- One property per user
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Only users can see and manage their own property
CREATE POLICY "Users can view own property" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own property" ON properties
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_properties_user_id ON properties(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add property_id to listings table to link listings to properties
ALTER TABLE listings ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

-- Create index for property_id
CREATE INDEX IF NOT EXISTS idx_listings_property_id ON listings(property_id);

-- Update listings RLS policy to allow viewing listings from user's property
DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;
CREATE POLICY "Anyone can view active listings" ON listings
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
