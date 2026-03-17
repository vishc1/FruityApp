-- Migration: Add missing columns to listings table
-- Run this in your Supabase SQL Editor

-- Add full_address column (stores the complete address)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Add zip_code column
ALTER TABLE listings ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Add pickup_notes column (for pickup instructions)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_notes TEXT;

-- Success message
SELECT 'Migration completed successfully! Added full_address, zip_code, and pickup_notes columns to listings table.' AS result;
