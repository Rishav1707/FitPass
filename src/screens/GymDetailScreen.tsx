// ─────────────────────────────────────────────────
// Gym Detail Screen
// ─────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gymService } from '../services/gym';
import { useCheckIn } from '../hooks';
import { useAppStore } from '../context/store';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import type { Gym, Review } from '../types';

export default function GymDetailScreen({ route, navigation }: any) {
  const { gymId } = route.params;
  const [gym, setGym] = useState<Gym | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [occupancy, setOccupancy] = useState(0);
  const { performCheckIn, loading: checkInLoading } = useCheckIn();
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    loadGym();
  }, [gymId]);

  useEffect(() => {
    if (!gymId) return;
    // Subscribe to real-time occupancy updates
    const channel = gymService.subscribeToOccupancy(gymId, (newOccupancy) => {
      setOccupancy(newOccupancy);
    });
    return () => { channel.unsubscribe(); };
  }, [gymId]);

  const loadGym = async () => {
    try {
      const [gymData, reviewData] = await Promise.all([
        gymService.getGymById(gymId),
        gymService.getGymReviews(gymId),
      ]);
      setGym(gymData);
      setOccupancy(gymData?.occupancy_percent ?? 0);
      setReviews(reviewData);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await performCheckIn(gymId);
      Alert.alert('✅ Checked In!', `Welcome to ${gym?.name}. Enjoy your workout!`);
    } catch (err: any) {
      Alert.alert('Check-in Failed', err.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: COLORS.textSecondary }}>Gym not found</Text>
      </View>
    );
  }

  const occupancyColor = occupancy < 40 ? COLORS.success : occupancy < 70 ? COLORS.warning : COLORS.danger;
  const occupancyLabel = occupancy < 40 ? 'Not busy — great time to go!' : occupancy < 70 ? 'Moderately busy' : 'Very busy right now';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={[styles.hero, gym.gym_type === 'premium' ? styles.heroPremium : styles.heroStandard]}>
        <Text style={styles.heroEmoji}>🏋️</Text>
        <Text style={styles.heroName}>{gym.name}</Text>
        <Text style={styles.heroLocation}>{gym.area}, {gym.city}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroRating}>★ {gym.rating} ({gym.review_count})</Text>
          <Text style={styles.heroHours}>🕐 {gym.hours}</Text>
        </View>
      </View>

      {/* Live Occupancy */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>Live Occupancy</Text>
          <Text style={[styles.occupancyPercent, { color: occupancyColor }]}>{occupancy}%</Text>
        </View>
        <View style={styles.occupancyTrack}>
          <View style={[styles.occupancyFill, { width: `${occupancy}%`, backgroundColor: occupancyColor }]} />
        </View>
        <Text style={styles.occupancyLabel}>{occupancyLabel}</Text>
      </View>

      {/* Amenities */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amenities</Text>
        <View style={styles.amenitiesWrap}>
          {gym.amenities?.map((a, i) => (
            <View key={i} style={styles.amenityChip}>
              <Text style={styles.amenityText}>{a}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Per Visit Price</Text>
        <Text style={styles.priceValue}>₹{gym.price_per_visit}</Text>
        <Text style={styles.priceSub}>Included in your {gym.gym_type === 'premium' ? 'Premium' : 'Standard'} plan</Text>
      </View>

      {/* Reviews */}
      {reviews.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reviews ({reviews.length})</Text>
          {reviews.slice(0, 3).map((r, i) => (
            <View key={i} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{(r.user as any)?.full_name ?? 'User'}</Text>
                <Text style={styles.reviewRating}>{'★'.repeat(r.rating)}</Text>
              </View>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Check-in Button */}
      <TouchableOpacity
        style={styles.checkInBtn}
        onPress={handleCheckIn}
        disabled={checkInLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentDim]}
          style={styles.checkInGradient}
        >
          {checkInLoading ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={styles.checkInText}>Check-in Now</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: SPACING.xl },
  backBtn: { paddingVertical: SPACING.md },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },

  hero: {
    borderRadius: RADIUS.xxl, padding: 28, alignItems: 'center', marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border,
  },
  heroStandard: { backgroundColor: `${COLORS.accent}10` },
  heroPremium: { backgroundColor: `${COLORS.premium}10` },
  heroEmoji: { fontSize: 56, marginBottom: 12 },
  heroName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  heroLocation: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  heroMeta: { flexDirection: 'row', gap: 16, marginTop: 14 },
  heroRating: { fontSize: 14, color: COLORS.warning },
  heroHours: { fontSize: 13, color: COLORS.textSecondary },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, ...SHADOWS.card,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },

  occupancyPercent: { fontSize: 14, fontWeight: '700' },
  occupancyTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: COLORS.border, overflow: 'hidden' },
  occupancyFill: { height: '100%', borderRadius: 3 },
  occupancyLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },

  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  amenityChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: COLORS.accentGlow2, borderWidth: 1, borderColor: `${COLORS.accent}20`,
  },
  amenityText: { fontSize: 12, color: COLORS.accent, fontWeight: '500' },

  priceValue: { fontSize: 28, fontWeight: '800', color: COLORS.accent },
  priceSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },

  reviewItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  reviewRating: { fontSize: 12, color: COLORS.warning },
  reviewComment: { fontSize: 12, color: COLORS.textSecondary },

  checkInBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.sm },
  checkInGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  checkInText: { fontSize: 16, fontWeight: '800', color: COLORS.bg, letterSpacing: 0.5 },
});
