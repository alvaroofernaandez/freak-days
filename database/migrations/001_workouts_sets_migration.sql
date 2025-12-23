-- Migration: Add workout sets and in-progress status
-- Execute this in Supabase SQL Editor
-- Date: 2024-12-23

BEGIN;

-- Step 1: Add new columns to workouts table
ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('in_progress', 'completed')) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Step 2: Create workout_sets table
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight_kg DECIMAL(6,2),
    rest_seconds INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exercise_id, set_number)
);

-- Step 3: Create indexes for workout_sets
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON public.workout_sets(exercise_id);

-- Step 4: Create index for in-progress workouts
CREATE INDEX IF NOT EXISTS idx_workouts_status ON public.workouts(user_id, status) WHERE status = 'in_progress';

-- Step 5: Migrate existing data from workout_exercises to workout_sets
-- This migrates old format (sets, reps, weight_kg in exercises) to new format (sets table)
DO $$
DECLARE
    exercise_record RECORD;
    set_num INTEGER;
BEGIN
    FOR exercise_record IN 
        SELECT id, sets, reps, weight_kg 
        FROM public.workout_exercises 
        WHERE sets IS NOT NULL AND sets > 0
    LOOP
        -- Create sets based on the old sets count
        FOR set_num IN 1..exercise_record.sets LOOP
            INSERT INTO public.workout_sets (exercise_id, set_number, reps, weight_kg)
            VALUES (exercise_record.id, set_num, exercise_record.reps, exercise_record.weight_kg)
            ON CONFLICT (exercise_id, set_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Step 6: Remove old columns from workout_exercises (after migration)
-- Note: Only remove if you're sure all data has been migrated
-- Uncomment these lines after verifying the migration worked:
-- ALTER TABLE public.workout_exercises 
-- DROP COLUMN IF EXISTS sets,
-- DROP COLUMN IF EXISTS reps,
-- DROP COLUMN IF EXISTS weight_kg;

-- Step 7: Add created_at to workout_exercises if it doesn't exist
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Step 8: Enable RLS on workout_sets
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policy for workout_sets
DROP POLICY IF EXISTS "Users can manage own workout sets" ON public.workout_sets;

CREATE POLICY "Users can manage own workout sets" ON public.workout_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_exercises we
            JOIN public.workouts w ON w.id = we.workout_id
            WHERE we.id = workout_sets.exercise_id 
            AND w.user_id = auth.uid()
        )
    );

-- Step 10: Update existing workouts to have 'completed' status
UPDATE public.workouts 
SET status = 'completed' 
WHERE status IS NULL;

COMMIT;

-- Verification queries (run these separately to verify):
-- SELECT COUNT(*) FROM public.workout_sets;
-- SELECT COUNT(*) FROM public.workouts WHERE status = 'in_progress';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workouts' AND column_name IN ('status', 'started_at', 'completed_at');

