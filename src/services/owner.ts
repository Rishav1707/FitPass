// ─────────────────────────────────────────────────
// Gym Owner Service
// ─────────────────────────────────────────────────
import { supabase } from './supabase';
import type { Gym, GymOwnerStats, CheckIn } from '../types';

export const ownerService = {
  // Get all gyms owned by this user
  async getOwnedGyms(ownerId: string): Promise<Gym[]> {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // Register a new gym
  async registerGym(ownerId: string, gym: {
    name: string;
    area: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    gym_type: 'standard' | 'premium';
    price_per_visit: number;
    amenities: string[];
    hours: string;
    phone?: string;
    email?: string;
    description?: string;
  }): Promise<Gym> {
    const { data, error } = await supabase
      .from('gyms')
      .insert({
        ...gym,
        owner_id: ownerId,
        rating: 0,
        review_count: 0,
        occupancy_percent: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update gym details
  async updateGym(gymId: string, ownerId: string, updates: Partial<Gym>): Promise<Gym> {
    const { data, error } = await supabase
      .from('gyms')
      .update(updates)
      .eq('id', gymId)
      .eq('owner_id', ownerId) // Ensure owner can only edit their own gym
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update occupancy
  async updateOccupancy(gymId: string, ownerId: string, percent: number) {
    const { error } = await supabase
      .from('gyms')
      .update({ occupancy_percent: percent })
      .eq('id', gymId)
      .eq('owner_id', ownerId);

    if (error) throw error;
  },

  // Toggle gym active status
  async toggleGymActive(gymId: string, ownerId: string, isActive: boolean) {
    const { error } = await supabase
      .from('gyms')
      .update({ is_active: isActive })
      .eq('id', gymId)
      .eq('owner_id', ownerId);

    if (error) throw error;
  },

  // Delete gym
  async deleteGym(gymId: string, ownerId: string) {
    const { error } = await supabase
      .from('gyms')
      .delete()
      .eq('id', gymId)
      .eq('owner_id', ownerId);

    if (error) throw error;
  },

  // Get check-ins for owner's gyms
  async getGymCheckins(gymId: string, limit: number = 50): Promise<CheckIn[]> {
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        user:users(full_name, avatar_url)
      `)
      .eq('gym_id', gymId)
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  // Get owner dashboard stats
  async getOwnerStats(ownerId: string): Promise<GymOwnerStats> {
    const { data, error } = await supabase.rpc('get_owner_stats', {
      target_owner_id: ownerId,
    });

    if (error) {
      // Fallback if RPC not set up yet
      return {
        total_checkins: 0,
        checkins_today: 0,
        checkins_this_month: 0,
        total_revenue: 0,
        revenue_this_month: 0,
        avg_rating: 0,
        total_reviews: 0,
      };
    }

    return data;
  },
};
