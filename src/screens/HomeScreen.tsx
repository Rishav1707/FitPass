// ─────────────────────────────────────────────────
// Home Screen
// ─────────────────────────────────────────────────
import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useGyms, useStats, useCheckIn } from '../hooks';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { nearbyGyms, fetchNearbyGyms, loading: gymsLoading } = useGyms();
  const { stats, weeklyStreak, fetchStats, loading: statsLoading } = useStats();
  const { checkInHistory, fetchHistory } = useCheckIn();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchNearbyGyms();
    fetchStats();
    fetchHistory();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchNearbyGyms(), fetchStats(), fetchHistory()]);
    setRefreshing(false);
  }, []);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const greeting = getGreeting();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{firstName} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('Profile')}
        >
          <LinearGradient colors={[COLORS.accent, '#00B8D4']} style={styles.avatarGradient}>
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakCount}>{stats?.current_streak ?? 0} Days 🔥</Text>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.monthCount}>{stats?.workouts_this_month ?? 0}</Text>
            <Text style={styles.monthLabel}>This month</Text>
          </View>
        </View>
        <View style={styles.weekRow}>
          {(weeklyStreak.length > 0
            ? weeklyStreak
            : ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => ({ day: d, completed: false }))
          ).map((item, i) => (
            <View key={i} style={styles.dayCol}>
              <View style={[styles.dayDot, item.completed && styles.dayDotActive]}>
                {item.completed && <Text style={styles.dayCheck}>✓</Text>}
              </View>
              <Text style={styles.dayLabel}>{item.day[0]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        {[
          { icon: '📍', label: 'Find Gym', desc: 'Nearby', screen: 'Explore' },
          { icon: '📷', label: 'Check-in', desc: 'QR Scan', screen: 'CheckIn' },
          { icon: '📊', label: 'Progress', desc: 'Stats', screen: 'Profile' },
          { icon: '🎯', label: 'Goals', desc: 'Weekly', screen: null },
        ].map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionCard}
            onPress={() => action.screen && navigation.navigate(action.screen)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionDesc}>{action.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nearby Gyms */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Gyms</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      {nearbyGyms.slice(0, 3).map((gym) => (
        <TouchableOpacity
          key={gym.id}
          style={styles.gymCard}
          onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
          activeOpacity={0.7}
        >
          <View style={styles.gymCardInner}>
            <View style={[styles.gymIcon, gym.gym_type === 'premium' && styles.gymIconPremium]}>
              <Text style={{ fontSize: 22 }}>🏋️</Text>
            </View>
            <View style={styles.gymInfo}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <Text style={styles.gymMeta}>{gym.area} · {(gym.latitude ? '~' : '')}{gym.city}</Text>
            </View>
            {gym.gym_type === 'premium' && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>
          <View style={styles.gymCardBottom}>
            <Text style={styles.gymRating}>★ {gym.rating}</Text>
            <Text style={styles.gymReviews}>({gym.review_count})</Text>
            <Text style={styles.gymPrice}>₹{gym.price_per_visit}/visit</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Recent Activity */}
      {checkInHistory.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: SPACING.xxl }]}>Recent Activity</Text>
          {checkInHistory.slice(0, 3).map((entry, i) => (
            <View key={i} style={styles.activityRow}>
              <View>
                <Text style={styles.activityGym}>{(entry.gym as any)?.name ?? 'Gym'}</Text>
                <Text style={styles.activityMeta}>
                  {new Date(entry.checked_in_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {entry.workout_type ? ` · ${entry.workout_type}` : ''}
                </Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={styles.activityDuration}>{entry.duration_minutes ?? '—'} min</Text>
                <Text style={styles.activityCal}>{entry.calories_burned ?? '—'} cal</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xxl },
  greeting: { fontSize: 13, color: COLORS.textSecondary },
  userName: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarGradient: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.bg },

  streakCard: {
    backgroundColor: COLORS.accentGlow2, borderRadius: RADIUS.xl, padding: SPACING.xl,
    marginBottom: SPACING.xl, borderWidth: 1, borderColor: `${COLORS.accent}25`,
  },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  streakLabel: { fontSize: 13, color: COLORS.textSecondary },
  streakCount: { fontSize: 28, fontWeight: '800', color: COLORS.accent, marginTop: 2 },
  streakRight: { alignItems: 'flex-end' },
  monthCount: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  monthLabel: { fontSize: 11, color: COLORS.textSecondary },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayDot: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotActive: { backgroundColor: COLORS.accent },
  dayCheck: { fontSize: 12, color: COLORS.bg, fontWeight: '700' },
  dayLabel: { fontSize: 10, color: COLORS.textMuted },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xxl },
  actionCard: {
    width: '48%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, flexGrow: 1, flexBasis: '45%',
  },
  actionIcon: { fontSize: 24, marginBottom: SPACING.sm },
  actionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  actionDesc: { fontSize: 11, color: COLORS.textSecondary },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  seeAll: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },

  gymCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, ...SHADOWS.card,
  },
  gymCardInner: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gymIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accentGlow2,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  gymIconPremium: { backgroundColor: COLORS.premiumGlow },
  gymInfo: { flex: 1 },
  gymName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  gymMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  premiumBadge: { backgroundColor: COLORS.premiumGlow, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  premiumBadgeText: { fontSize: 9, fontWeight: '700', color: COLORS.premium, letterSpacing: 0.5 },
  gymCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gymRating: { fontSize: 12, color: COLORS.warning },
  gymReviews: { fontSize: 11, color: COLORS.textMuted },
  gymPrice: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 'auto' },

  activityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.sm,
  },
  activityGym: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  activityMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  activityRight: { alignItems: 'flex-end' },
  activityDuration: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  activityCal: { fontSize: 11, color: COLORS.textMuted },
});
