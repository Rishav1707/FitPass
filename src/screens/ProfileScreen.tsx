// ─────────────────────────────────────────────────
// Profile Screen — Stats, History, Settings
// ─────────────────────────────────────────────────
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useStats, useCheckIn, useSubscription } from '../hooks';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { stats, fetchStats } = useStats();
  const { checkInHistory, fetchHistory } = useCheckIn();
  const { subscription, fetchSubscription } = useSubscription();

  useEffect(() => {
    fetchStats();
    fetchHistory();
    fetchSubscription();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const firstName = user?.full_name?.split(' ')[0] ?? '';

  const statItems = [
    { label: 'Workouts', value: stats?.total_workouts ?? 0, icon: '💪' },
    { label: 'Gyms Visited', value: stats?.gyms_visited ?? 0, icon: '🏋️' },
    { label: 'Calories', value: stats?.total_calories ? `${(stats.total_calories / 1000).toFixed(1)}K` : '0', icon: '🔥' },
    { label: 'Hours', value: stats?.total_duration_minutes ? Math.round(stats.total_duration_minutes / 60) : 0, icon: '⏱️' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <LinearGradient colors={[COLORS.accent, '#00B8D4']} style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() ?? 'U'}</Text>
        </LinearGradient>
        <Text style={styles.name}>{user?.full_name ?? 'User'}</Text>
        <Text style={styles.meta}>{user?.city ?? ''} · Member since {
          user?.member_since
            ? new Date(user.member_since).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
            : '—'
        }</Text>

        {subscription && (
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              ⭐ {subscription.plan_type.toUpperCase()} MEMBER
            </Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statItems.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Streak Info */}
      <View style={styles.streakRow}>
        <View style={styles.streakItem}>
          <Text style={styles.streakValue}>{stats?.current_streak ?? 0}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        <View style={[styles.streakItem, { borderLeftWidth: 1, borderLeftColor: COLORS.border }]}>
          <Text style={styles.streakValue}>{stats?.best_streak ?? 0}</Text>
          <Text style={styles.streakLabel}>Best Streak</Text>
        </View>
      </View>

      {/* Workout History */}
      {checkInHistory.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Workout History</Text>
          {checkInHistory.slice(0, 10).map((entry, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={styles.historyIcon}>
                <Text style={{ fontSize: 16 }}>
                  {entry.workout_type === 'Strength' ? '🏋️' :
                   entry.workout_type === 'Cardio' ? '🏃' :
                   entry.workout_type === 'Yoga' ? '🧘' : '🔥'}
                </Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyGym}>{(entry.gym as any)?.name ?? 'Gym'}</Text>
                <Text style={styles.historyMeta}>
                  {new Date(entry.checked_in_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {entry.workout_type ? ` · ${entry.workout_type}` : ''}
                </Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyDuration}>{entry.duration_minutes ?? '—'} min</Text>
                <Text style={styles.historyCal}>{entry.calories_burned ?? '—'} kcal</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Settings */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.xxl }]}>Settings</Text>
      {[
        { label: 'Account Settings', action: () => {} },
        { label: 'Notification Preferences', action: () => {} },
        { label: 'Payment Methods', action: () => {} },
        { label: 'Help & Support', action: () => {} },
        { label: 'Log Out', action: handleLogout, danger: true },
      ].map((item, i) => (
        <TouchableOpacity key={i} style={styles.settingsRow} onPress={item.action} activeOpacity={0.6}>
          <Text style={[styles.settingsText, item.danger && styles.settingsDanger]}>{item.label}</Text>
          {!item.danger && <Text style={styles.settingsArrow}>›</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.version}>FitPass v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },

  profileHeader: { alignItems: 'center', marginBottom: SPACING.xxl },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    ...SHADOWS.glow,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: COLORS.bg },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  planBadge: {
    marginTop: 10, paddingVertical: 4, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: COLORS.premiumGlow, borderWidth: 1, borderColor: `${COLORS.premium}30`,
  },
  planBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.premium },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xxl },
  statCard: {
    width: '47%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', flexGrow: 1, flexBasis: '45%',
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  streakRow: {
    flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xxl, overflow: 'hidden',
  },
  streakItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  streakValue: { fontSize: 28, fontWeight: '800', color: COLORS.accent },
  streakLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },

  historyRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  historyIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.accentGlow2,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  historyInfo: { flex: 1 },
  historyGym: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  historyMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyDuration: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  historyCal: { fontSize: 11, color: COLORS.textMuted },

  settingsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingsText: { fontSize: 14, color: COLORS.textPrimary },
  settingsDanger: { color: COLORS.danger, fontWeight: '600' },
  settingsArrow: { fontSize: 18, color: COLORS.textMuted },

  version: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 24 },
});
