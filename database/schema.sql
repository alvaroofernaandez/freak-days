-- FreakDays Database Schema for Supabase
-- PostgreSQL with Row Level Security (RLS) ready

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    total_exp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON public.profiles(username);

-- User enabled modules
CREATE TABLE public.user_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL CHECK (module_id IN ('workouts', 'manga', 'anime', 'quests', 'party', 'calendar')),
    enabled BOOLEAN DEFAULT true,
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

CREATE INDEX idx_user_modules_user ON public.user_modules(user_id);

-- Workouts module
CREATE TABLE public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    workout_date DATE NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    status TEXT CHECK (status IN ('in_progress', 'completed')) DEFAULT 'completed',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, workout_date DESC);
CREATE INDEX idx_workouts_status ON public.workouts(user_id, status) WHERE status = 'in_progress';

CREATE TABLE public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_exercises_workout ON public.workout_exercises(workout_id);

CREATE TABLE public.workout_sets (
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

CREATE INDEX idx_workout_sets_exercise ON public.workout_sets(exercise_id);

-- Manga collection module
CREATE TABLE public.manga_collection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    total_volumes INTEGER,
    owned_volumes INTEGER[],
    status TEXT CHECK (status IN ('collecting', 'completed', 'dropped', 'wishlist')) DEFAULT 'collecting',
    score INTEGER CHECK (score >= 1 AND score <= 10),
    notes TEXT,
    cover_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manga_user ON public.manga_collection(user_id);
CREATE INDEX idx_manga_status ON public.manga_collection(user_id, status);

-- Anime module
CREATE TABLE public.anime_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch', 'rewatching')),
    current_episode INTEGER DEFAULT 0,
    total_episodes INTEGER,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    notes TEXT,
    cover_url TEXT,
    start_date DATE,
    end_date DATE,
    rewatch_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anime_user ON public.anime_list(user_id);
CREATE INDEX idx_anime_status ON public.anime_list(user_id, status);

-- Quests (Daily missions) module
CREATE TABLE public.quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
    exp_reward INTEGER NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quests_user ON public.quests(user_id);
CREATE INDEX idx_quests_active ON public.quests(user_id, active);

CREATE TABLE public.quest_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    exp_earned INTEGER NOT NULL,
    streak_count INTEGER DEFAULT 1
);

CREATE INDEX idx_quest_completions_quest ON public.quest_completions(quest_id);
CREATE INDEX idx_quest_completions_user_date ON public.quest_completions(user_id, completed_at DESC);

-- Party system module
CREATE TABLE public.parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parties_owner ON public.parties(owner_id);
CREATE INDEX idx_parties_invite ON public.parties(invite_code);

CREATE TABLE public.party_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(party_id, user_id)
);

CREATE INDEX idx_party_members_party ON public.party_members(party_id);
CREATE INDEX idx_party_members_user ON public.party_members(user_id);

CREATE TABLE public.party_shared_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    list_type TEXT CHECK (list_type IN ('anime', 'manga', 'quests')) NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_party_lists_party ON public.party_shared_lists(party_id);

-- Calendar releases module
CREATE TABLE public.release_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    release_type TEXT NOT NULL CHECK (release_type IN ('anime_episode', 'manga_volume', 'event', 'movie', 'game')),
    release_date DATE NOT NULL,
    description TEXT,
    url TEXT,
    is_global BOOLEAN DEFAULT false,
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_releases_date ON public.release_calendar(release_date);
CREATE INDEX idx_releases_user ON public.release_calendar(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_releases_global ON public.release_calendar(is_global) WHERE is_global = true;

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_calendar ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User modules policies
CREATE POLICY "Users can manage own modules" ON public.user_modules
    FOR ALL USING (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Users can manage own workouts" ON public.workouts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workout exercises" ON public.workout_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workouts 
            WHERE workouts.id = workout_exercises.workout_id 
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own workout sets" ON public.workout_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_exercises we
            JOIN public.workouts w ON w.id = we.workout_id
            WHERE we.id = workout_sets.exercise_id 
            AND w.user_id = auth.uid()
        )
    );

-- Manga policies
CREATE POLICY "Users can manage own manga" ON public.manga_collection
    FOR ALL USING (auth.uid() = user_id);

-- Anime policies
CREATE POLICY "Users can manage own anime" ON public.anime_list
    FOR ALL USING (auth.uid() = user_id);

-- Quests policies
CREATE POLICY "Users can manage own quests" ON public.quests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quest completions" ON public.quest_completions
    FOR ALL USING (auth.uid() = user_id);

-- Party policies
CREATE POLICY "Users can view parties they belong to" ON public.parties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.party_members 
            WHERE party_members.party_id = parties.id 
            AND party_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update parties" ON public.parties
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can create parties" ON public.parties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete parties" ON public.parties
    FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Party members can view members" ON public.party_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.party_members pm 
            WHERE pm.party_id = party_members.party_id 
            AND pm.user_id = auth.uid()
        )
    );

-- Release calendar policies
CREATE POLICY "Users can view global releases" ON public.release_calendar
    FOR SELECT USING (is_global = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own releases" ON public.release_calendar
    FOR ALL USING (auth.uid() = user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workouts_updated_at BEFORE UPDATE ON public.workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER manga_updated_at BEFORE UPDATE ON public.manga_collection
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER anime_updated_at BEFORE UPDATE ON public.anime_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER quests_updated_at BEFORE UPDATE ON public.quests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER parties_updated_at BEFORE UPDATE ON public.parties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
