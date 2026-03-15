// ─────────────────────────────────────────────────
// Owner Gym Detail Screen — View & Manage a Gym
// ─────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../context/store';
import { ownerService } from '../../services/owner';
import { gymService } from '../../services/gym';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import type { Gym, Review, CheckIn } from '../../types';

export default function OwnerGymDetailScreen({ route, navigation }: any) {
  const { gymId } = route.params;
  const user = useAppStore((s) => s.user);
  const setOwnedGyms = useAppStore((s) => s.setOwnedGyms);
  const ownedGyms = useAppStore((s) => s.ownedGyms);

  const [gym, setGym] = useState<Gym | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Occupancy slider state
  const [occupancy, setOccupancy] = useState(0);
  const [occupancyInput, setOccupancyInput] = useState('');
  const [savingOccupancy, setSavingOccupancy] = useState(false);

  useEffect(() => { loadData(); }, [gymId]);

  const loadData = async () => {
    try {
      const [gymData, reviewData, checkinData] = await Promise.all([
        gymService.getGymById(gymId),
        gymService.getGymReviews(gymId),
        ownerService.getGymCheckins(gymId, 10),
      ]);
      setGym(gymData);
      setOccupancy(gymData?.occupancy_percent ?? 0);
      setOccupancyInput(String(gymData?.occupancy_percent ?? 0));
      setReviews(reviewData);
      setRecentCheckins(checkinData);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [gymId]);

  // ─── Update Occupancy ─────────────────────────
  const handleUpdateOccupancy = async (value: number) => {
    if (!user || !gym) return;
    const clamped = Math.min(100, Math.max(0, value));
    setSavingOccupancy(true);
    try {
      await ownerService.updateOccupancy(gymId, user.id, clamped);
      setOccupancy(clamped);
      setOccupancyInput(String(clamped));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingOccupancy(false);
    }
  };

  // ─── Toggle Active ────────────────────────────
  const handleToggleActive = () => {
    if (!gym || !user) return;
    const newStatus = !gym.is_active;
    Alert.alert(
      newStatus ? 'Activate Gym' : 'Deactivate Gym',
      newStatus
        ? 'This gym will be visible to users and available for check-ins.'
        : 'This gym will be hidden from users. No new check-ins will be allowed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus ? 'Activate' : 'Deactivate',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await ownerService.toggleGymActive(gymId, user.id, newStatus);
              setGym({ ...gym, is_active: newStatus });
              // Update in owned gyms list
              setOwnedGyms(ownedGyms.map((g) => g.id === gymId ? { ...g, is_active: newStatus } : g));
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  // ─── Delete Gym ───────────────────────────────
  const handleDelete = () => {
    if (!user) return;
    Alert.alert(
      'Delete Gym',
      'Are you sure? This action cannot be undone. All check-in history for this gym will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerService.deleteGym(gymId, user.id);
              setOwnedGyms(ownedGyms.filter((g) => g.id !== gymId));
              navigation.goBack();
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
        <ActivityIndicator color={COLORS.premium} size="large" />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textSecondary }}>Gym not found</Text>
      </View>
    );
  }

  const occupancyColor = occupancy < 40 ? COLORS.success : occupancy < 70 ? COLORS.warning : COLORS.danger;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.premium} />}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Dashboard</Text>
      </TouchableOpacity>

      {/* ── Hero Card ── */}
      <View style={[styles.heroCard, gym.gym_type === 'premium' ? styles.heroPremium : styles.heroStandard]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroName}>{gym.name}</Text>
            <Text style={styles.heroLocation}>{gym.area}, {gym.city}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: gym.is_active ? `${COLORS.success}15` : `${COLORS.danger}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: gym.is_active ? COLORS.success : COLORS.danger }]} />
            <Text style={[styles.statusText, { color: gym.is_active ? COLORS.success : COLORS.danger }]}>
              {gym.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>★ {gym.rating}</Text>
            <Text style={styles.heroStatLabel}>Rating</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{gym.review_count}</Text>
            <Text style={styles.heroStatLabel}>Reviews</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>₹{gym.price_per_visit}</Text>
            <Text style={styles.heroStatLabel}>Per Visit</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatValue, { textTransform: 'capitalize' }]}>{gym.gym_type}</Text>
            <Text style={styles.heroStatLabel}>Type</Text>
          </View>
        </View>
      </View>

      {/* ── Live Occupancy Control ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Occupancy Control</Text>
        <Text style={styles.cardSubtitle}>Update how busy your gym is right now</Text>

        <View style={styles.occupancyDisplay}>
          <Text style={[styles.occupancyValue, { color: occupancyColor }]}>{occupancy}%</Text>
          <Text style={styles.occupancyLabel}>
            {occupancy < 40 ? 'Not busy' : occupancy < 70 ? 'Moderately busy' : 'Very busy'}
          </Text>
        </View>

        <View style={styles.occupancyBar}>
          <View style={[styles.occupancyFill, { width: `${occupancy}%`, backgroundColor: occupancyColor }]} />
        </View>

        {/* Quick set buttons */}
        <View style={styles.occupancyBtns}>
          {[0, 25, 50, 75, 100].map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.occBtn, occupancy === val && { borderColor: occupancyColor, backgroundColor: `${occupancyColor}15` }]}
              onPress={() => handleUpdateOccupancy(val)}
              disabled={savingOccupancy}
            >
              <Text style={[styles.occBtnText, occupancy === val && { color: occupancyColor, fontWeight: '700' }]}>
                {val}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom input */}
        <View style={styles.customOccRow}>
          <TextInput
            style={styles.customOccInput}
            value={occupancyInput}
            onChangeText={setOccupancyInput}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="0-100"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={styles.customOccBtn}
            onPress={() => handleUpdateOccupancy(parseInt(occupancyInput) || 0)}
            disabled={savingOccupancy}
          >
            {savingOccupancy ? (
              <ActivityIndicator color={COLORS.bg} size="small" />
            ) : (
              <Text style={styles.customOccBtnText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Gym Details ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gym Details</Text>

        <DetailRow label="Address" value={gym.address} />
        <DetailRow label="Operating Hours" value={gym.hours} />
        <DetailRow label="Phone" value={gym.phone || 'Not set'} />
        <DetailRow label="Email" value={gym.email || 'Not set'} />
        <DetailRow label="Description" value={gym.description || 'No description'} />
        <DetailRow label="Coordinates" value={`${gym.latitude.toFixed(6)}, ${gym.longitude.toFixed(6)}`} />
      </View>

      {/* ── Amenities ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amenities ({gym.amenities?.length ?? 0})</Text>
        <View style={styles.amenitiesWrap}>
          {gym.amenities?.length > 0 ? (
            gym.amenities.map((a, i) => (
              <View key={i} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No amenities listed</Text>
          )}
        </View>
      </View>

      {/* ── Recent Check-ins ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Check-ins</Text>
        {recentCheckins.length === 0 ? (
          <Text style={styles.emptyText}>No check-ins yet</Text>
        ) : (
          recentCheckins.map((ci, i) => (
            <View key={i} style={styles.checkinRow}>
              <View style={styles.checkinAvatar}>
                <Text style={styles.checkinAvatarText}>
                  {((ci as any).user?.full_name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.checkinInfo}>
                <Text style={styles.checkinName}>{(ci as any).user?.full_name ?? 'Member'}</Text>
                <Text style={styles.checkinTime}>
                  {new Date(ci.checked_in_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.checkinStatus}>
                {ci.checked_out_at ? (
                  <Text style={styles.checkinCompleted}>{ci.duration_minutes ?? '—'} min</Text>
                ) : (
                  <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active</Text></View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── Reviews ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reviews ({reviews.length})</Text>
        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet</Text>
        ) : (
          reviews.slice(0, 5).map((r, i) => (
            <View key={i} style={styles.reviewRow}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{(r.user as any)?.full_name ?? 'User'}</Text>
                <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
              </View>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
              <Text style={styles.reviewDate}>
                {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ── QR Code ── */}
      <TouchableOpacity
        style={styles.qrBtn}
        onPress={() => navigation.navigate('GymQRCode', { gym })}
        activeOpacity={0.8}
      >
        <LinearGradient colors={[COLORS.premium, '#B8922E']} style={styles.qrBtnGradient}>
          <Text style={styles.qrBtnIcon}>📱</Text>
          <View style={styles.qrBtnContent}>
            <Text style={styles.qrBtnTitle}>View Check-in QR Code</Text>
            <Text style={styles.qrBtnDesc}>Display at your gym for members to scan</Text>
          </View>
          <Text style={styles.qrBtnArrow}>→</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Actions ── */}
      <Text style={styles.sectionTitle}>Manage</Text>

      <TouchableOpacity style={styles.actionBtn} onPress={handleToggleActive} activeOpacity={0.7}>
        <Text style={styles.actionIcon}>{gym.is_active ? '⏸️' : '▶️'}</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>{gym.is_active ? 'Deactivate Gym' : 'Activate Gym'}</Text>
          <Text style={styles.actionDesc}>
            {gym.is_active ? 'Hide from users temporarily' : 'Make visible to users again'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete} activeOpacity={0.7}>
        <Text style={styles.actionIcon}>🗑️</Text>
        <View style={styles.actionContent}>
          <Text style={[styles.actionTitle, { color: COLORS.danger }]}>Delete Gym</Text>
          <Text style={styles.actionDesc}>Permanently remove this gym and all its data</Text>
        </View>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  backBtn: { marginBottom: SPACING.lg },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.premium },

  // Hero
  heroCard: {
    borderRadius: RADIUS.xl, padding: 22, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.elevated,
  },
  heroStandard: { backgroundColor: `${COLORS.accent}08` },
  heroPremium: { backgroundColor: `${COLORS.premium}08` },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  heroName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  heroLocation: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  heroStatLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  heroStatDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  // Cards
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, ...SHADOWS.card,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.md },

  // Occupancy
  occupancyDisplay: { alignItems: 'center', marginBottom: SPACING.md },
  occupancyValue: { fontSize: 48, fontWeight: '800' },
  occupancyLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  occupancyBar: {
    width: '100%', height: 8, borderRadius: 4,
    backgroundColor: COLORS.border, overflow: 'hidden', marginBottom: SPACING.lg,
  },
  occupancyFill: { height: '100%', borderRadius: 4 },
  occupancyBtns: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  occBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
  },
  occBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  customOccRow: { flexDirection: 'row', gap: 10 },
  customOccInput: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 12,
    fontSize: 16, fontWeight: '700', color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, textAlign: 'center',
  },
  customOccBtn: {
    backgroundColor: COLORS.premium, borderRadius: RADIUS.md,
    paddingHorizontal: 24, justifyContent: 'center',
  },
  customOccBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.bg },

  // Details
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  detailLabel: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  detailValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500', flex: 2, textAlign: 'right' },

  // Amenities
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  amenityChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16,
    backgroundColor: COLORS.premiumGlow, borderWidth: 1, borderColor: `${COLORS.premium}20`,
  },
  amenityText: { fontSize: 12, color: COLORS.premium, fontWeight: '500' },

  // Check-ins
  checkinRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  checkinAvatar: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.accentGlow2,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkinAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  checkinInfo: { flex: 1 },
  checkinName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  checkinTime: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  checkinStatus: { alignItems: 'flex-end' },
  checkinCompleted: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  activeBadge: { backgroundColor: `${COLORS.warning}15`, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 8 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.warning },

  // Reviews
  reviewRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  reviewStars: { fontSize: 12, color: COLORS.warning },
  reviewComment: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  reviewDate: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },

  // Actions
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.textPrimary,
    marginBottom: SPACING.md, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  actionBtnDanger: { borderColor: `${COLORS.danger}30` },
  actionIcon: { fontSize: 24 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  actionDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 4 },

  // QR Code button
  qrBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.xl },
  qrBtnGradient: {
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14, borderRadius: RADIUS.lg,
  },
  qrBtnIcon: { fontSize: 28 },
  qrBtnContent: { flex: 1 },
  qrBtnTitle: { fontSize: 16, fontWeight: '800', color: COLORS.bg },
  qrBtnDesc: { fontSize: 12, color: 'rgba(10,14,26,0.6)', marginTop: 2 },
  qrBtnArrow: { fontSize: 20, fontWeight: '700', color: COLORS.bg },
});
