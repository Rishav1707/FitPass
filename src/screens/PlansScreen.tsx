// ─────────────────────────────────────────────────
// Plans Screen — Subscription Selection
// ─────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../hooks';
import { subscriptionService } from '../services/subscription';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import type { Plan } from '../types';

const PLAN_COLORS: Record<string, string> = {
  standard: COLORS.accent,
  premium: COLORS.premium,
  annual: COLORS.orange,
};

export default function PlansScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string>('premium');
  const [loading, setLoading] = useState(true);
  const { subscription, subscribe, loading: subLoading, fetchSubscription } = useSubscription();

  useEffect(() => {
    loadPlans();
    fetchSubscription();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await subscriptionService.getPlans();
      setPlans(data);
      if (data.length > 0) {
        const popular = data.find((p) => p.is_popular);
        if (popular) setSelected(popular.plan_type);
      }
    } catch (err) {
      // Fallback to hardcoded plans if DB not set up yet
      setPlans([
        {
          id: '1', name: 'Standard', plan_type: 'standard', price: 999,
          period: '/month', is_popular: false,
          features: ['Access to Standard gyms', 'Up to 12 visits/month', 'QR digital check-in', 'Gym ratings & reviews', 'Basic workout tracking'],
        },
        {
          id: '2', name: 'Premium', plan_type: 'premium', price: 1999,
          period: '/month', is_popular: true,
          features: ['Access to ALL gyms', 'Unlimited visits', 'QR digital check-in', 'Priority booking', 'Advanced analytics', 'Trainer connect', 'Guest passes (2/month)'],
        },
        {
          id: '3', name: 'Annual Premium', plan_type: 'annual', price: 17999,
          period: '/year', is_popular: false,
          features: ['Everything in Premium', 'Save ₹5,989/year', 'Free merchandise kit', 'Early access to features', 'Dedicated support'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    // In production, integrate with Razorpay here
    // For MVP, simulate a payment
    Alert.alert(
      'Subscribe',
      `Subscribe to ${selected} plan? This will open the payment gateway.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const fakePaymentId = `pay_${Date.now()}`;
              await subscribe(selected as any, fakePaymentId);
              Alert.alert('🎉 Welcome!', 'Your subscription is now active. Start exploring gyms!');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>One membership, any gym, anywhere in India</Text>

      {/* Current plan indicator */}
      {subscription && (
        <View style={styles.currentPlan}>
          <Text style={styles.currentPlanText}>
            Current plan: <Text style={{ color: COLORS.accent, fontWeight: '700' }}>
              {subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)}
            </Text>
          </Text>
        </View>
      )}

      {/* Plan Cards */}
      {plans.map((plan) => {
        const color = PLAN_COLORS[plan.plan_type] ?? COLORS.accent;
        const isSelected = selected === plan.plan_type;
        const isCurrent = subscription?.plan_type === plan.plan_type;

        return (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              isSelected && { borderColor: color, backgroundColor: `${color}10` },
            ]}
            onPress={() => setSelected(plan.plan_type)}
            activeOpacity={0.7}
          >
            {plan.is_popular && (
              <View style={[styles.popularBadge, { backgroundColor: color }]}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}
            {isCurrent && (
              <View style={[styles.popularBadge, { backgroundColor: COLORS.success }]}>
                <Text style={styles.popularBadgeText}>CURRENT PLAN</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color }]}>₹{plan.price.toLocaleString('en-IN')}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
              <View style={[styles.radio, isSelected && { borderColor: color }]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: color }]} />}
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, { color }]}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Subscribe Button */}
      <TouchableOpacity
        style={styles.subscribeBtn}
        onPress={handleSubscribe}
        disabled={subLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[PLAN_COLORS[selected] ?? COLORS.accent, COLORS.accent]}
          style={styles.subscribeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {subLoading ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={styles.subscribeBtnText}>
              {subscription ? 'Change Plan' : 'Subscribe Now'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Revenue share info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          Your subscription fees are shared with partner gyms. Gyms receive 70–80% of every check-in, ensuring they're motivated to provide the best experience.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xxl },

  currentPlan: {
    backgroundColor: COLORS.accentGlow2, borderRadius: RADIUS.md, padding: 12,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: `${COLORS.accent}20`,
  },
  currentPlanText: { fontSize: 13, color: COLORS.textSecondary },

  planCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: 22,
    borderWidth: 2, borderColor: COLORS.border, marginBottom: SPACING.lg,
    position: 'relative', ...SHADOWS.card,
  },
  popularBadge: {
    position: 'absolute', top: -10, right: 20,
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.bg, letterSpacing: 0.5 },

  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  planPrice: { fontSize: 30, fontWeight: '800' },
  planPeriod: { fontSize: 13, color: COLORS.textMuted, marginLeft: 2 },

  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },

  featuresList: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureCheck: { fontSize: 12, fontWeight: '700' },
  featureText: { fontSize: 12, color: COLORS.textSecondary },

  subscribeBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.sm },
  subscribeGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  subscribeBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.bg, letterSpacing: 0.5 },

  infoCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 18,
    marginTop: SPACING.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  infoText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
