// ─────────────────────────────────────────────────
// Owner Profile Screen
// ─────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks';
import { useAppStore } from '../../context/store';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

export default function OwnerProfileScreen() {
  const { user, signOut } = useAuth();
  const ownedGyms = useAppStore((s) => s.ownedGyms);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <LinearGradient colors={[COLORS.premium, '#B8922E']} style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.full_name?.[0] ?? 'O').toUpperCase()}</Text>
        </LinearGradient>
        <Text style={styles.name}>{user?.full_name ?? 'Owner'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerBadgeText}>🏢 GYM OWNER · {ownedGyms.length} gym{ownedGyms.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>City</Text>
          <Text style={styles.infoValue}>{user?.city ?? '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {user?.member_since ? new Date(user.member_since).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
          </Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Account Type</Text>
          <Text style={styles.infoValue}>Gym Owner</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.xxl }]}>Settings</Text>
      {[
        { label: 'Account Settings', action: () => {} },
        { label: 'Notification Preferences', action: () => {} },
        { label: 'Payout & Bank Details', action: () => {} },
        { label: 'Help & Support', action: () => {} },
        { label: 'Log Out', action: handleLogout, danger: true },
      ].map((item, i) => (
        <TouchableOpacity key={i} style={styles.settingsRow} onPress={item.action} activeOpacity={0.6}>
          <Text style={[styles.settingsText, item.danger && styles.settingsDanger]}>{item.label}</Text>
          {!item.danger && <Text style={styles.settingsArrow}>›</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.version}>FitPass Owner Portal v1.0.0</Text>
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
    alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...SHADOWS.glow,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: COLORS.bg },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  email: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  ownerBadge: {
    marginTop: 10, paddingVertical: 4, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: COLORS.premiumGlow, borderWidth: 1, borderColor: `${COLORS.premium}30`,
  },
  ownerBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.premium },
  infoCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  settingsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingsText: { fontSize: 14, color: COLORS.textPrimary },
  settingsDanger: { color: COLORS.danger, fontWeight: '600' },
  settingsArrow: { fontSize: 18, color: COLORS.textMuted },
  version: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 24 },
});
