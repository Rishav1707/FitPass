// ─────────────────────────────────────────────────
// Owner Dashboard Screen
// ─────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../context/store';
import { ownerService } from '../../services/owner';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import type { GymOwnerStats } from '../../types';

export default function OwnerDashboardScreen({ navigation }: any) {
  const user = useAppStore((s) => s.user);
  const ownedGyms = useAppStore((s) => s.ownedGyms);
  const setOwnedGyms = useAppStore((s) => s.setOwnedGyms);
  const [stats, setStats] = useState<GymOwnerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const [gyms, ownerStats] = await Promise.all([
        ownerService.getOwnedGyms(user.id),
        ownerService.getOwnerStats(user.id),
      ]);
      setOwnedGyms(gyms);
      setStats(ownerStats);
    } catch (err) { console.error(err); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  const firstName = user?.full_name?.split(' ')[0] ?? 'Owner';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.premium} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.userName}>{firstName} 👋</Text>
        </View>
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerBadgeText}>🏢 OWNER</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ownedGyms.length}</Text>
          <Text style={styles.statLabel}>Gyms</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.accent }]}>{stats?.checkins_today ?? 0}</Text>
          <Text style={styles.statLabel}>Today's Check-ins</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.checkins_this_month ?? 0}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.premium }]}>
            ₹{((stats?.revenue_this_month ?? 0) / 1000).toFixed(1)}K
          </Text>
          <Text style={styles.statLabel}>Revenue (Month)</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>★ {(stats?.avg_rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.total_reviews ?? 0}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <TouchableOpacity style={styles.addGymBtn} onPress={() => navigation.navigate('RegisterGym')} activeOpacity={0.8}>
        <LinearGradient colors={[COLORS.premium, '#B8922E']} style={styles.addGymGradient}>
          <Text style={styles.addGymText}>+ Register New Gym</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* My Gyms */}
      <Text style={styles.sectionTitle}>Your Gyms</Text>
      {ownedGyms.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🏋️</Text>
          <Text style={styles.emptyText}>No gyms registered yet</Text>
          <Text style={styles.emptySubtext}>Tap "Register New Gym" to get started</Text>
        </View>
      ) : (
        ownedGyms.map((gym) => (
          <TouchableOpacity
            key={gym.id}
            style={styles.gymCard}
            onPress={() => navigation.navigate('EditGym', { gymId: gym.id })}
            activeOpacity={0.7}
          >
            <View style={styles.gymCardHeader}>
              <View>
                <Text style={styles.gymName}>{gym.name}</Text>
                <Text style={styles.gymLocation}>{gym.area}, {gym.city}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: gym.is_active ? COLORS.success : COLORS.danger }]} />
            </View>
            <View style={styles.gymCardStats}>
              <Text style={styles.gymStat}>★ {gym.rating}</Text>
              <Text style={styles.gymStat}>₹{gym.price_per_visit}/visit</Text>
              <Text style={styles.gymStat}>Occupancy: {gym.occupancy_percent}%</Text>
              <Text style={[styles.gymTypeBadge, gym.gym_type === 'premium' && styles.gymTypePremium]}>
                {gym.gym_type.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xxl },
  greeting: { fontSize: 13, color: COLORS.textSecondary },
  userName: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  ownerBadge: {
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: COLORS.premiumGlow, borderWidth: 1, borderColor: `${COLORS.premium}30`,
  },
  ownerBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.premium },

  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },

  addGymBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.lg, marginBottom: SPACING.xxl },
  addGymGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  addGymText: { fontSize: 16, fontWeight: '800', color: COLORS.bg, letterSpacing: 0.5 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },

  emptyCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 32,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  emptySubtext: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  gymCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, ...SHADOWS.card,
  },
  gymCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  gymName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  gymLocation: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  gymCardStats: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  gymStat: { fontSize: 12, color: COLORS.textSecondary },
  gymTypeBadge: {
    fontSize: 9, fontWeight: '700', color: COLORS.accent, backgroundColor: COLORS.accentGlow,
    paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6,
  },
  gymTypePremium: { color: COLORS.premium, backgroundColor: COLORS.premiumGlow },
});
