-- ═══════════════════════════════════════════════════
-- Migration 002: Add Role-Based Access + Gym Ownership
-- Run this in Supabase SQL Editor AFTER 001
-- ═══════════════════════════════════════════════════

-- Add role column to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'gym_owner'));

-- Add owner fields to gyms
ALTER TABLE public.gyms
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Index for fast owner gym lookups
CREATE INDEX IF NOT EXISTS idx_gyms_owner ON public.gyms(owner_id);

-- Update the handle_new_user trigger to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, city, role, streak_days, total_workouts, member_since)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Hyderabad'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    0,
    0,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RLS Policies for Gym Owners ────────────────

-- Gym owners can insert their own gyms
CREATE POLICY "Owners can insert gyms" ON public.gyms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Gym owners can update only their own gyms
CREATE POLICY "Owners can update own gyms" ON public.gyms
  FOR UPDATE USING (auth.uid() = owner_id);

-- Gym owners can delete only their own gyms
CREATE POLICY "Owners can delete own gyms" ON public.gyms
  FOR DELETE USING (auth.uid() = owner_id);

-- Gym owners can see check-ins for their gyms
CREATE POLICY "Owners can read checkins for their gyms" ON public.check_ins
  FOR SELECT USING (
    auth.uid() IN (SELECT owner_id FROM public.gyms WHERE id = gym_id)
  );

-- ─── Owner Stats RPC ────────────────────────────

CREATE OR REPLACE FUNCTION get_owner_stats(target_owner_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_checkins', COALESCE((
      SELECT COUNT(*) FROM public.check_ins ci
      JOIN public.gyms g ON g.id = ci.gym_id
      WHERE g.owner_id = target_owner_id
    ), 0),
    'checkins_today', COALESCE((
      SELECT COUNT(*) FROM public.check_ins ci
      JOIN public.gyms g ON g.id = ci.gym_id
      WHERE g.owner_id = target_owner_id
        AND ci.checked_in_at::date = CURRENT_DATE
    ), 0),
    'checkins_this_month', COALESCE((
      SELECT COUNT(*) FROM public.check_ins ci
      JOIN public.gyms g ON g.id = ci.gym_id
      WHERE g.owner_id = target_owner_id
        AND ci.checked_in_at >= date_trunc('month', CURRENT_DATE)
    ), 0),
    'total_revenue', COALESCE((
      SELECT SUM(g.price_per_visit * 0.75) FROM public.check_ins ci
      JOIN public.gyms g ON g.id = ci.gym_id
      WHERE g.owner_id = target_owner_id
    ), 0),
    'revenue_this_month', COALESCE((
      SELECT SUM(g.price_per_visit * 0.75) FROM public.check_ins ci
      JOIN public.gyms g ON g.id = ci.gym_id
      WHERE g.owner_id = target_owner_id
        AND ci.checked_in_at >= date_trunc('month', CURRENT_DATE)
    ), 0),
    'avg_rating', COALESCE((
      SELECT ROUND(AVG(g.rating)::numeric, 1) FROM public.gyms g
      WHERE g.owner_id = target_owner_id AND g.rating > 0
    ), 0),
    'total_reviews', COALESCE((
      SELECT SUM(g.review_count) FROM public.gyms g
      WHERE g.owner_id = target_owner_id
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
