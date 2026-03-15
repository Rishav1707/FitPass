// ─────────────────────────────────────────────────
// Gym Service — CRUD + Search + Geolocation
// ─────────────────────────────────────────────────
import { supabase } from './supabase';
import type { Gym, Review, CheckIn } from '../types';

export const gymService = {
  // Fetch all active gyms (with optional city filter)
  async getGyms(city?: string): Promise<Gym[]> {
    let query = supabase
      .from('gyms')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  // Fetch nearby gyms using PostGIS distance calculation
  // Requires the PostGIS extension enabled in Supabase
  async getNearbyGyms(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<Gym[]> {
    const { data, error } = await supabase.rpc('get_nearby_gyms', {
      user_lat: latitude,
      user_lng: longitude,
      radius_km: radiusKm,
    });

    if (error) throw error;
    return data ?? [];
  },

  // Fetch single gym details
  async getGymById(gymId: string): Promise<Gym | null> {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single();

    if (error) throw error;
    return data;
  },

  // Search gyms by name or area
  async searchGyms(query: string, city?: string): Promise<Gym[]> {
    let dbQuery = supabase
      .from('gyms')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,area.ilike.%${query}%`);

    if (city) {
      dbQuery = dbQuery.eq('city', city);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;
    return data ?? [];
  },

  // Filter gyms by type
  async getGymsByType(type: 'standard' | 'premium', city?: string): Promise<Gym[]> {
    let query = supabase
      .from('gyms')
      .select('*')
      .eq('is_active', true)
      .eq('gym_type', type);

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  // Get gym reviews
  async getGymReviews(gymId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users(full_name, avatar_url)
      `)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // Submit a review
  async submitReview(
    userId: string,
    gymId: string,
    rating: number,
    comment?: string
  ): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        gym_id: gymId,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) throw error;

    // Update gym's aggregate rating
    await supabase.rpc('update_gym_rating', { target_gym_id: gymId });

    return data;
  },

  // Update live occupancy (called by gym partners via their dashboard)
  async updateOccupancy(gymId: string, percent: number) {
    const { error } = await supabase
      .from('gyms')
      .update({ occupancy_percent: percent })
      .eq('id', gymId);

    if (error) throw error;
  },

  // Subscribe to real-time occupancy updates
  subscribeToOccupancy(gymId: string, callback: (occupancy: number) => void) {
    return supabase
      .channel(`occupancy:${gymId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gyms',
          filter: `id=eq.${gymId}`,
        },
        (payload) => {
          callback(payload.new.occupancy_percent);
        }
      )
      .subscribe();
  },
};
