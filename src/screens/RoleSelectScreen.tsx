// ─────────────────────────────────────────────────
// Role Selection Screen
// ─────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function RoleSelectScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <LinearGradient colors={[COLORS.accent, COLORS.accentDim]} style={styles.logoCircle}>
            <Text style={styles.logoText}>F</Text>
          </LinearGradient>
          <Text style={styles.brandName}>FitPass</Text>
          <Text style={styles.tagline}>One Membership. Any Gym. Anywhere.</Text>
        </View>

        <Text style={styles.question}>How would you like to use FitPass?</Text>

        {/* User Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => navigation.navigate('Login', { role: 'user' })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[`${COLORS.accent}15`, `${COLORS.accent}05`]}
            style={styles.roleGradient}
          >
            <View style={styles.roleIconWrap}>
              <Text style={styles.roleIcon}>🏃</Text>
            </View>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>I'm a Fitness Enthusiast</Text>
              <Text style={styles.roleDesc}>
                Find gyms nearby, check-in with QR, track workouts, and access any partner gym with one membership.
              </Text>
            </View>
            <Text style={styles.roleArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Gym Owner Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => navigation.navigate('Login', { role: 'gym_owner' })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[`${COLORS.premium}15`, `${COLORS.premium}05`]}
            style={styles.roleGradient}
          >
            <View style={[styles.roleIconWrap, { backgroundColor: COLORS.premiumGlow }]}>
              <Text style={styles.roleIcon}>🏢</Text>
            </View>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>I'm a Gym Owner</Text>
              <Text style={styles.roleDesc}>
                Register your gym, manage check-ins, track revenue, update occupancy, and grow your customer base.
              </Text>
            </View>
            <Text style={styles.roleArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },

  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: COLORS.bg },
  brandName: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  tagline: { fontSize: 14, color: COLORS.textSecondary },

  question: {
    fontSize: 18, fontWeight: '700', color: COLORS.textPrimary,
    textAlign: 'center', marginBottom: 24,
  },

  roleCard: {
    borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  roleGradient: {
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14,
  },
  roleIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: COLORS.accentGlow, alignItems: 'center', justifyContent: 'center',
  },
  roleIcon: { fontSize: 26 },
  roleContent: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  roleDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  roleArrow: { fontSize: 20, color: COLORS.textMuted, fontWeight: '600' },
});
