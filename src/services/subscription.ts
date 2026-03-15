// ─────────────────────────────────────────────────
// Subscription Service — Plans, Payments, Status
// ─────────────────────────────────────────────────
import { supabase } from './supabase';
import type { Plan, Subscription } from '../types';

export const subscriptionService = {
  // Get all available plans
  async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  // Get user's active subscription
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Create a new subscription
  // In production, this would integrate with Razorpay/Stripe
  async subscribe(
    userId: string,
    planType: 'standard' | 'premium' | 'annual',
    paymentId: string // From payment gateway
  ): Promise<Subscription> {
    // Determine subscription duration
    const durations: Record<string, number> = {
      standard: 30,
      premium: 30,
      annual: 365,
    };

    const prices: Record<string, number> = {
      standard: 999,
      premium: 1999,
      annual: 17999,
    };

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(startsAt.getDate() + durations[planType]);

    // Cancel any existing active subscription
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Create new subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        price: prices[planType],
        currency: 'INR',
        status: 'active',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
        payment_id: paymentId,
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's plan info
    await supabase
      .from('users')
      .update({ plan_type: planType, plan_id: data.id })
      .eq('id', userId);

    return data;
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', auto_renew: false })
      .eq('id', subscriptionId);

    if (error) throw error;
  },

  // Check if user can access a gym type
  async canAccessGymType(
    userId: string,
    gymType: 'standard' | 'premium'
  ): Promise<boolean> {
    const subscription = await this.getActiveSubscription(userId);
    if (!subscription) return false;

    if (gymType === 'standard') return true;
    return ['premium', 'annual'].includes(subscription.plan_type);
  },
};
