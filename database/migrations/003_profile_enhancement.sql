-- Migration: Add additional fields to profiles table
-- Execute this in Supabase SQL Editor
-- Date: 2024-12-24

BEGIN;

-- Step 1: Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS favorite_anime_id UUID REFERENCES public.anime_list(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS favorite_manga_id UUID REFERENCES public.manga_collection(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_anime ON public.profiles(favorite_anime_id);
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_manga ON public.profiles(favorite_manga_id);

COMMIT;

