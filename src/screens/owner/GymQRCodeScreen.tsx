// ─────────────────────────────────────────────────
// Gym QR Code Screen — For Gym Owners to Display
// Supports both Check-in and Check-out via same QR
// ─────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from '../../components/QRCode';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import type { Gym } from '../../types';

// QR data format that the scanner understands
function generateQRData(gymId: string): string {
  return `fitpass://gym/${gymId}`;
}

export default function GymQRCodeScreen({ route, navigation }: any) {
  const { gym } = route.params as { gym: Gym };
  const [showFullscreen, setShowFullscreen] = useState(false);

  const qrData = generateQRData(gym.id);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Scan this QR code to check-in/check-out at ${gym.name} on FitPass!\n\n${qrData}`,
        title: `${gym.name} — FitPass QR Code`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Fullscreen QR for display at gym entrance ──
  if (showFullscreen) {
    return (
      <TouchableOpacity
        style={styles.fullscreenContainer}
        onPress={() => setShowFullscreen(false)}
        activeOpacity={1}
      >
        <View style={styles.fullscreenCard}>
          {/* Logo */}
          <LinearGradient colors={[COLORS.premium, '#B8922E']} style={styles.fullscreenLogo}>
            <Text style={styles.fullscreenLogoText}>FP</Text>
          </LinearGradient>

          <Text style={styles.fullscreenGymName}>{gym.name}</Text>
          <Text style={styles.fullscreenSubtitle}>Scan to Check-in / Check-out</Text>

          <View style={styles.fullscreenQRWrap}>
            <QRCode data={qrData} size={280} color="#0A0E1A" backgroundColor="#FFFFFF" />
          </View>

          <View style={styles.fullscreenBadge}>
            <Text style={styles.fullscreenBadgeText}>Powered by FitPass</Text>
          </View>

          <Text style={styles.fullscreenHint}>Tap anywhere to exit fullscreen</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // ─── Normal View ────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Gym QR Code</Text>
      <Text style={styles.subtitle}>Display this QR code at your gym entrance for members to scan</Text>

      {/* QR Card */}
      <View style={styles.qrCard}>
        <View style={styles.qrHeader}>
          <LinearGradient colors={[COLORS.premium, '#B8922E']} style={styles.qrLogo}>
            <Text style={styles.qrLogoText}>FP</Text>
          </LinearGradient>
          <Text style={styles.qrGymName}>{gym.name}</Text>
          <Text style={styles.qrGymLocation}>{gym.area}, {gym.city}</Text>
        </View>

        <View style={styles.qrCodeWrap}>
          <QRCode data={qrData} size={220} color="#0A0E1A" backgroundColor="#FFFFFF" />
        </View>

        <Text style={styles.qrInstruction}>Scan to Check-in / Check-out</Text>
        <Text style={styles.qrId}>ID: {gym.id.slice(0, 8)}...</Text>
      </View>

      {/* How it works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works</Text>

        <View style={styles.step}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Member scans QR code</Text>
            <Text style={styles.stepDesc}>Using the FitPass app's Check-in tab camera</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Auto Check-in or Check-out</Text>
            <Text style={styles.stepDesc}>If no active session → checks in. If already checked in → shows checkout flow with workout summary.</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: COLORS.premiumGlow }]}>
            <Text style={[styles.stepNumberText, { color: COLORS.premium }]}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>You earn revenue</Text>
            <Text style={styles.stepDesc}>Every check-in generates ₹{Math.round(gym.price_per_visit * 0.75)} for your gym (75% revenue share)</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.fullscreenBtn} onPress={() => setShowFullscreen(true)} activeOpacity={0.8}>
        <LinearGradient colors={[COLORS.premium, '#B8922E']} style={styles.fullscreenBtnGradient}>
          <Text style={styles.fullscreenBtnText}>📺 Display Fullscreen at Gym</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
        <Text style={styles.shareBtnText}>📤 Share QR Code</Text>
      </TouchableOpacity>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>📌 Tips for placement</Text>
        <Text style={styles.tipItem}>• Print and laminate the QR code for durability</Text>
        <Text style={styles.tipItem}>• Place at eye level near the entrance</Text>
        <Text style={styles.tipItem}>• Ensure good lighting for easy scanning</Text>
        <Text style={styles.tipItem}>• Use the fullscreen mode on a tablet at reception</Text>
        <Text style={styles.tipItem}>• Keep a backup printed copy in case the device is off</Text>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  backBtn: { marginBottom: SPACING.lg },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.premium },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xxl },

  // QR Card
  qrCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xxl, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.xl, ...SHADOWS.elevated,
  },
  qrHeader: { alignItems: 'center', marginBottom: 24 },
  qrLogo: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  qrLogoText: { fontSize: 18, fontWeight: '800', color: COLORS.bg },
  qrGymName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  qrGymLocation: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  qrCodeWrap: {
    padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16,
    ...SHADOWS.card,
  },
  qrInstruction: { fontSize: 14, fontWeight: '700', color: COLORS.premium, marginTop: 20 },
  qrId: { fontSize: 11, color: COLORS.textMuted, marginTop: 6, fontVariant: ['tabular-nums'] },

  // How it works
  infoCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  step: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  stepNumber: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.accentGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { fontSize: 14, fontWeight: '800', color: COLORS.accent },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  stepDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },

  // Buttons
  fullscreenBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.md },
  fullscreenBtnGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  fullscreenBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.bg, letterSpacing: 0.5 },
  shareBtn: {
    paddingVertical: 16, borderRadius: RADIUS.lg, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
    marginBottom: SPACING.xl,
  },
  shareBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },

  // Tips
  tipsCard: {
    backgroundColor: `${COLORS.premium}08`, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: `${COLORS.premium}20`,
  },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.premium, marginBottom: 10 },
  tipItem: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 20 },

  // Fullscreen
  fullscreenContainer: {
    flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  fullscreenCard: { alignItems: 'center', padding: 32 },
  fullscreenLogo: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  fullscreenLogoText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  fullscreenGymName: { fontSize: 24, fontWeight: '800', color: '#0A0E1A', marginBottom: 4 },
  fullscreenSubtitle: { fontSize: 15, color: '#666', marginBottom: 32 },
  fullscreenQRWrap: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: '#E0E0E0' },
  fullscreenBadge: {
    marginTop: 24, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: '#F5F0E5',
  },
  fullscreenBadgeText: { fontSize: 13, fontWeight: '700', color: '#B8922E' },
  fullscreenHint: { fontSize: 12, color: '#AAA', marginTop: 20 },
});
