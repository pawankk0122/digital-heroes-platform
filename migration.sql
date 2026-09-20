-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CUSTOM ENUM TYPES
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('public_visitor', 'registered_subscriber', 'administrator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'lapsed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE draw_mode AS ENUM ('random', 'algorithmic');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. PUBLIC USER PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'registered_subscriber' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 4. CHARITY DIRECTORY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    upcoming_events JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 5. SUBSCRIPTIONS & BILLING STATUS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status subscription_status DEFAULT 'inactive' NOT NULL,
    plan subscription_plan DEFAULT 'monthly' NOT NULL,
    charity_id UUID REFERENCES public.charities(id),
    charity_percentage NUMERIC(5,2) DEFAULT 10.00 CHECK (charity_percentage >= 10.00),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 6. GOLF SCORES & ROLLING 5-SCORE FIFO TRIGGER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.golf_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
    played_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_played_date UNIQUE (user_id, played_date)
);

-- Trigger Function: Retain ONLY latest 5 scores per golfer
CREATE OR REPLACE FUNCTION handle_five_score_fifo()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.golf_scores
    WHERE id IN (
        SELECT id FROM public.golf_scores
        WHERE user_id = NEW.user_id
        ORDER BY played_date DESC, created_at DESC
        OFFSET 5
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_enforce_five_scores ON public.golf_scores;
CREATE TRIGGER tr_enforce_five_scores
AFTER INSERT ON public.golf_scores
FOR EACH ROW
EXECUTE FUNCTION handle_five_score_fifo();

-- ==============================================================================
-- 7. MONTHLY DRAWS & PRIZE POOLS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year DATE NOT NULL UNIQUE,
    draw_mode draw_mode DEFAULT 'random' NOT NULL,
    winning_numbers INTEGER[] DEFAULT '{}',
    total_pool_amount NUMERIC(12,2) DEFAULT 0.00,
    tier_5_pool NUMERIC(12,2) DEFAULT 0.00, -- 40% + rollover
    tier_4_pool NUMERIC(12,2) DEFAULT 0.00, -- 35%
    tier_3_pool NUMERIC(12,2) DEFAULT 0.00, -- 25%
    is_published BOOLEAN DEFAULT FALSE,
    rolled_over_from_prev NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 8. WINNER VERIFICATION & SCREENSHOT REVIEW
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_tier INTEGER NOT NULL CHECK (match_tier IN (3, 4, 5)),
    prize_share NUMERIC(12,2) NOT NULL,
    proof_screenshot_url TEXT,
    verification_status payout_status DEFAULT 'pending' NOT NULL,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Charities: Public read
DROP POLICY IF EXISTS "Public read charities" ON public.charities;
CREATE POLICY "Public read charities" ON public.charities FOR SELECT USING (true);

-- Profiles: Users view own profile
DROP POLICY IF EXISTS "Profiles user view" ON public.profiles;
CREATE POLICY "Profiles user view" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Subscriptions: Users view own subscription
DROP POLICY IF EXISTS "Subscription user view" ON public.subscriptions;
CREATE POLICY "Subscription user view" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Scores: Full CRUD by score owner
DROP POLICY IF EXISTS "Scores CRUD by owner" ON public.golf_scores;
CREATE POLICY "Scores CRUD by owner" ON public.golf_scores FOR ALL USING (auth.uid() = user_id);

-- Winners: View own winnings
DROP POLICY IF EXISTS "Winners read by owner" ON public.winners;
CREATE POLICY "Winners read by owner" ON public.winners FOR SELECT USING (auth.uid() = user_id);

-- Draws: Public read if published
DROP POLICY IF EXISTS "Draws public if published" ON public.draws;
CREATE POLICY "Draws public if published" ON public.draws FOR SELECT USING (is_published = true);

-- ==============================================================================
-- 10. STORAGE BUCKET CONFIGURATION
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-proofs', 'verification-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Proofs Bucket RLS: Users can upload and read their own proof screenshots
DROP POLICY IF EXISTS "Golfer proof upload" ON storage.objects;
CREATE POLICY "Golfer proof upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'verification-proofs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Golfer proof read own" ON storage.objects;
CREATE POLICY "Golfer proof read own" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'verification-proofs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
