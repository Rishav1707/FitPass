-- ═══════════════════════════════════════════════════
-- FitPass — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── Users Table ────────────────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  plan_id UUID,
  plan_type TEXT CHECK (plan_type IN ('standard', 'premium', 'annual')),
  streak_days INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  member_since TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Gyms Table ─────────────────────────────────
CREATE TABLE public.gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326),
  rating NUMERIC(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  gym_type TEXT NOT NULL CHECK (gym_type IN ('standard', 'premium')),
  price_per_visit INTEGER NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  hours TEXT DEFAULT '6 AM - 10 PM',
  image_url TEXT,
  occupancy_percent INTEGER DEFAULT 0 CHECK (occupancy_percent BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update geography column on insert/update
CREATE OR REPLACE FUNCTION update_gym_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gym_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.gyms
  FOR EACH ROW EXECUTE FUNCTION update_gym_location();

-- ─── Plans Table ────────────────────────────────
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('standard', 'premium', 'annual')),
  price INTEGER NOT NULL,
  period TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Subscriptions Table ────────────────────────
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('standard', 'premium', 'annual')),
  price INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Check-ins Table ────────────────────────────
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  workout_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Reviews Table ──────────────────────────────
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, gym_id) -- One review per user per gym
);

-- ═══════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════
CREATE INDEX idx_gyms_city ON public.gyms(city);
CREATE INDEX idx_gyms_type ON public.gyms(gym_type);
CREATE INDEX idx_gyms_active ON public.gyms(is_active);
CREATE INDEX idx_gyms_location ON public.gyms USING GIST(location);
CREATE INDEX idx_check_ins_user ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_gym ON public.check_ins(gym_id);
CREATE INDEX idx_check_ins_date ON public.check_ins(checked_in_at DESC);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_reviews_gym ON public.reviews(gym_id);

-- ═══════════════════════════════════════════════════
-- RPC Functions
-- ═══════════════════════════════════════════════════

-- Get nearby gyms using PostGIS
CREATE OR REPLACE FUNCTION get_nearby_gyms(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS SETOF public.gyms AS $$
BEGIN
  RETURN QUERY
  SELECT g.*
  FROM public.gyms g
  WHERE g.is_active = TRUE
    AND ST_DWithin(
      g.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY g.location <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update gym aggregate rating
CREATE OR REPLACE FUNCTION update_gym_rating(target_gym_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.gyms
  SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE gym_id = target_gym_id), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE gym_id = target_gym_id)
  WHERE id = target_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user streak
CREATE OR REPLACE FUNCTION update_user_streak(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  -- Count consecutive days with check-ins going backwards from today
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.check_ins
      WHERE user_id = target_user_id
        AND checked_in_at::date = check_date
    ) THEN
      streak := streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  UPDATE public.users SET streak_days = streak WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment workout count
CREATE OR REPLACE FUNCTION increment_workout_count(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET total_workouts = total_workouts + 1
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get workout statistics
CREATE OR REPLACE FUNCTION get_workout_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_workouts', COALESCE(u.total_workouts, 0),
    'total_duration_minutes', COALESCE((SELECT SUM(duration_minutes) FROM public.check_ins WHERE user_id = target_user_id AND duration_minutes IS NOT NULL), 0),
    'total_calories', COALESCE((SELECT SUM(calories_burned) FROM public.check_ins WHERE user_id = target_user_id AND calories_burned IS NOT NULL), 0),
    'gyms_visited', COALESCE((SELECT COUNT(DISTINCT gym_id) FROM public.check_ins WHERE user_id = target_user_id), 0),
    'current_streak', COALESCE(u.streak_days, 0),
    'best_streak', COALESCE(u.streak_days, 0),
    'workouts_this_month', COALESCE((
      SELECT COUNT(*) FROM public.check_ins
      WHERE user_id = target_user_id
        AND checked_in_at >= date_trunc('month', CURRENT_DATE)
    ), 0)
  ) INTO result
  FROM public.users u
  WHERE u.id = target_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users: read own, update own
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Gyms: everyone can read active gyms
CREATE POLICY "Anyone can read active gyms" ON public.gyms FOR SELECT USING (is_active = TRUE);

-- Plans: everyone can read
CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT USING (TRUE);

-- Subscriptions: read/insert own
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Check-ins: read/insert own
CREATE POLICY "Users can read own check-ins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create check-ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own check-ins" ON public.check_ins FOR UPDATE USING (auth.uid() = user_id);

-- Reviews: read all, insert/update own
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- Seed Data
-- ═══════════════════════════════════════════════════

-- Seed Plans
INSERT INTO public.plans (name, plan_type, price, period, features, is_popular) VALUES
  ('Standard', 'standard', 999, '/month', ARRAY['Access to Standard gyms', 'Up to 12 visits/month', 'QR digital check-in', 'Gym ratings & reviews', 'Basic workout tracking'], FALSE),
  ('Premium', 'premium', 1999, '/month', ARRAY['Access to ALL gyms', 'Unlimited visits', 'QR digital check-in', 'Priority booking', 'Advanced analytics', 'Trainer connect', 'Guest passes (2/month)'], TRUE),
  ('Annual Premium', 'annual', 17999, '/year', ARRAY['Everything in Premium', 'Save ₹5,989/year', 'Free merchandise kit', 'Early access to features', 'Dedicated support'], FALSE);

-- Seed Gyms (Hyderabad)
INSERT INTO public.gyms (name, area, city, address, latitude, longitude, rating, review_count, gym_type, price_per_visit, amenities, hours, occupancy_percent) VALUES
  ('Iron Paradise', 'Banjara Hills', 'Hyderabad', 'Road No. 12, Banjara Hills', 17.4156, 78.4347, 4.8, 342, 'premium', 80, ARRAY['AC', 'Pool', 'Sauna', 'Parking'], '5 AM - 11 PM', 62),
  ('FitZone Studio', 'Madhapur', 'Hyderabad', 'Ayyappa Society, Madhapur', 17.4486, 78.3908, 4.5, 218, 'standard', 50, ARRAY['AC', 'Cardio', 'Weights'], '6 AM - 10 PM', 45),
  ('Muscle Factory', 'Jubilee Hills', 'Hyderabad', 'Jubilee Hills Check Post', 17.4311, 78.4073, 4.7, 189, 'premium', 70, ARRAY['AC', 'CrossFit', 'Yoga', 'Parking'], '5 AM - 11 PM', 78),
  ('Zen Fitness Hub', 'Gachibowli', 'Hyderabad', 'DLF Cyber City, Gachibowli', 17.4401, 78.3489, 4.3, 156, 'standard', 45, ARRAY['AC', 'Yoga', 'Meditation'], '6 AM - 9 PM', 31),
  ('PowerHouse Gym', 'Kukatpally', 'Hyderabad', 'KPHB Colony', 17.4947, 78.3996, 4.6, 267, 'standard', 60, ARRAY['AC', 'Weights', 'Cardio', 'Boxing'], '5 AM - 10 PM', 55),
  ('Elite Fitness Club', 'Kondapur', 'Hyderabad', 'Kondapur Main Road', 17.4598, 78.3565, 4.9, 412, 'premium', 100, ARRAY['AC', 'Pool', 'Spa', 'Cafe', 'Parking'], 'Open 24/7', 40);

-- Seed Gyms (Bangalore)
INSERT INTO public.gyms (name, area, city, address, latitude, longitude, rating, review_count, gym_type, price_per_visit, amenities, hours, occupancy_percent) VALUES
  ('Cult.fit Koramangala', 'Koramangala', 'Bangalore', '80 Feet Road, Koramangala', 12.9352, 77.6245, 4.6, 534, 'premium', 90, ARRAY['AC', 'CrossFit', 'MMA', 'Yoga', 'Parking'], '5 AM - 11 PM', 70),
  ('Gold''s Gym Indiranagar', 'Indiranagar', 'Bangalore', '100 Feet Road, Indiranagar', 12.9784, 77.6408, 4.4, 289, 'premium', 85, ARRAY['AC', 'Pool', 'Sauna', 'Weights'], '5 AM - 11 PM', 58),
  ('Snap Fitness Whitefield', 'Whitefield', 'Bangalore', 'ITPL Main Road', 12.9698, 77.7500, 4.3, 176, 'standard', 55, ARRAY['AC', 'Cardio', 'Weights'], '6 AM - 10 PM', 42);

-- Seed Gyms (Mumbai)
INSERT INTO public.gyms (name, area, city, address, latitude, longitude, rating, review_count, gym_type, price_per_visit, amenities, hours, occupancy_percent) VALUES
  ('Talwalkars Andheri', 'Andheri West', 'Mumbai', 'Lokhandwala Complex', 19.1368, 72.8306, 4.5, 445, 'premium', 95, ARRAY['AC', 'Pool', 'Steam', 'Parking'], '5 AM - 11 PM', 65),
  ('Fitness First BKC', 'BKC', 'Mumbai', 'Bandra Kurla Complex', 19.0596, 72.8656, 4.7, 312, 'premium', 110, ARRAY['AC', 'Pool', 'Spa', 'Cafe', 'Parking'], 'Open 24/7', 50);

-- Enable realtime for occupancy updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.gyms;
