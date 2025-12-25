-- Migration: Add pricing fields to manga collection
-- Execute this in Supabase SQL Editor
-- Date: 2024-12-24

BEGIN;

-- Step 1: Add pricing columns to manga_collection table
ALTER TABLE public.manga_collection 
ADD COLUMN IF NOT EXISTS price_per_volume DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;

-- Step 2: Calculate total_cost for existing entries based on owned_volumes and price_per_volume
-- This will be NULL for existing entries until they set a price_per_volume
UPDATE public.manga_collection
SET total_cost = COALESCE(
  array_length(owned_volumes, 1) * price_per_volume,
  0
)
WHERE price_per_volume IS NOT NULL;

COMMIT;

