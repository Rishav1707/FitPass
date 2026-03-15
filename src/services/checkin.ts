// ─────────────────────────────────────────────────
// Check-in Service — QR Scan, Sessions, History
// ─────────────────────────────────────────────────
import { supabase } from './supabase';
import type { CheckIn, WorkoutStats } from '../types';

export const checkinService = {
  // Process a QR check-in
  // The QR code contains the gym_id encoded as a JWT or signed payload
  async checkIn(userId: string, gymId: string): Promise<CheckIn> {
    // Verify user has an active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      throw new Error('No active subscription found. Please subscribe to check in.');
    }

    // Verify gym type matches subscription
    const { data: gym } = await supabase
      .from('gyms')
      .select('gym_type, name')
      .eq('id', gymId)
      .single();

    if (!gym) {
      throw new Error('Gym not found. Invalid QR code.');
    }

    if (
      gym.gym_type === 'premium' &&
      subscription.plan_type === 'standard'
    ) {
      throw new Error(
        'Your Standard plan doesn\'t include Premium gyms. Upgrade to access this gym.'
      );
    }

    // Check if user already has an active session
    const { data: activeSession } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .is('checked_out_at', null)
      .single();

    if (activeSession) {
      throw new Error(
        'You already have an active session. Please check out first.'
      );
    }

    // Create the check-in record
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: userId,
        gym_id: gymId,
        checked_in_at: new Date().toISOString(),
      })
      .select(`
        *,
        gym:gyms(name, area, city)
      `)
      .single();

    if (error) throw error;

    // Update user streak
    await supabase.rpc('update_user_streak', { target_user_id: userId });

    return data;
  },

  // Check out from current session
  async checkOut(
    checkInId: string,
    workoutType?: string,
    caloriesBurned?: number
  ): Promise<CheckIn> {
    const now = new Date();

    // Get the check-in to calculate duration
    const { data: existing } = await supabase
      .from('check_ins')
      .select('checked_in_at')
      .eq('id', checkInId)
      .single();

    if (!existing) throw new Error('Check-in not found.');

    const checkedInAt = new Date(existing.checked_in_at);
    const durationMinutes = Math.round(
      (now.getTime() - checkedInAt.getTime()) / (1000 * 60)
    );

    const { data, error } = await supabase
      .from('check_ins')
      .update({
        checked_out_at: now.toISOString(),
        duration_minutes: durationMinutes,
        workout_type: workoutType,
        calories_burned: caloriesBurned,
      })
      .eq('id', checkInId)
      .select(`
        *,
        gym:gyms(name, area, city)
      `)
      .single();

    if (error) throw error;

    // Update total workouts count
    await supabase.rpc('increment_workout_count', {
      target_user_id: data.user_id,
    });

    return data;
  },

  // Get active session (if any)
  async getActiveSession(userId: string): Promise<CheckIn | null> {
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        gym:gyms(name, area, city, image_url)
      `)
      .eq('user_id', userId)
      .is('checked_out_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get check-in history
  async getHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CheckIn[]> {
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        gym:gyms(name, area, city)
      `)
      .eq('user_id', userId)
      .not('checked_out_at', 'is', null)
      .order('checked_in_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data ?? [];
  },

  // Get workout statistics
  async getStats(userId: string): Promise<WorkoutStats> {
    const { data, error } = await supabase.rpc('get_workout_stats', {
      target_user_id: userId,
    });

    if (error) throw error;

    return (
      data ?? {
        total_workouts: 0,
        total_duration_minutes: 0,
        total_calories: 0,
        gyms_visited: 0,
        current_streak: 0,
        best_streak: 0,
        workouts_this_month: 0,
      }
    );
  },

  // Get streak data for the week view
  async getWeeklyStreak(
    userId: string
  ): Promise<{ day: string; completed: boolean }[]> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const { data, error } = await supabase
      .from('check_ins')
      .select('checked_in_at')
      .eq('user_id', userId)
      .gte('checked_in_at', weekAgo.toISOString())
      .lte('checked_in_at', today.toISOString());

    if (error) throw error;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const checkedDays = new Set(
      (data ?? []).map((c) => new Date(c.checked_in_at).getDay())
    );

    return days.map((day, index) => ({
      day,
      completed: checkedDays.has(index === 6 ? 0 : index + 1),
    }));
  },
};
