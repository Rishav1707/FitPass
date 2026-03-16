// ─────────────────────────────────────────────────
// Check-in Screen — QR Scanner + Checkout Flow
// ─────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { useCheckIn } from '../hooks';
import { useAppStore } from '../context/store';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const WORKOUT_TYPES = [
  { id: 'Strength', icon: '🏋️', label: 'Strength' },
  { id: 'Cardio', icon: '🏃', label: 'Cardio' },
  { id: 'CrossFit', icon: '🔥', label: 'CrossFit' },
  { id: 'Yoga', icon: '🧘', label: 'Yoga' },
  { id: 'HIIT', icon: '⚡', label: 'HIIT' },
  { id: 'Swimming', icon: '🏊', label: 'Swimming' },
  { id: 'Boxing', icon: '🥊', label: 'Boxing' },
  { id: 'Other', icon: '💪', label: 'Other' },
];

// ─── Elapsed Timer Hook ─────────────────────────
function useElapsedTime(startTime: string | null) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!startTime) return;

    const update = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

export default function CheckInScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<{ gymName: string; gymId: string } | null>(null);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [calories, setCalories] = useState<number>(0);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const { performCheckIn, performCheckOut, activeSession, fetchActiveSession, loading } = useCheckIn();
  const user = useAppStore((s) => s.user);
  const elapsed = useElapsedTime(activeSession?.checked_in_at ?? null);

  // Scan line animation (runs once)
  const scanY = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Refresh active session every time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchActiveSession();
    }, [])
  );

  const animatedScanLine = useAnimatedStyle(() => ({
    top: `${scanY.value * 100}%`,
  }));

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const gymId = parseQRData(data);

      // Debug: show what was scanned
      console.log('[QR Scanned] raw:', data, '→ gymId:', gymId);

      if (!gymId) {
        Alert.alert(
          'Invalid QR Code',
          `Could not read a valid FitPass gym ID.\n\nScanned data: "${data.substring(0, 60)}..."`,
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      // Check if user already has an active session at THIS gym
      if (activeSession && activeSession.gym_id === gymId) {
        Alert.alert(
          '🏁 End Workout?',
          `You're already checked in at ${(activeSession.gym as any)?.name ?? 'this gym'}. Would you like to check out?`,
          [
            { text: 'Keep Working Out', onPress: () => setScanned(false) },
            { text: 'Check Out', onPress: () => { setShowCheckout(true); } },
          ]
        );
        return;
      }

      // Check if user has an active session at a DIFFERENT gym
      if (activeSession && activeSession.gym_id !== gymId) {
        Alert.alert(
          'Active Session',
          `You're still checked in at ${(activeSession.gym as any)?.name ?? 'another gym'}. Please check out first.`,
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return;
      }

      // No active session → check in
      const session = await performCheckIn(gymId);
      setScanResult({
        gymName: (session.gym as any)?.name ?? 'Gym',
        gymId,
      });
    } catch (err: any) {
      console.error('[QR Check-in Error]', err);
      Alert.alert('Check-in Failed', err.message || 'Something went wrong. Please try again.', [
        { text: 'Try Again', onPress: () => setScanned(false) },
      ]);
    }
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const confirmCheckout = async () => {
    if (!selectedWorkout) {
      Alert.alert('Select Workout', 'Please select what type of workout you did.');
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await performCheckOut(selectedWorkout, calories > 0 ? calories : undefined);
      setCheckoutComplete(true);
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message);
    }
  };

  const resetAll = () => {
    setScanned(false);
    setScanResult(null);
    setShowCheckout(false);
    setSelectedWorkout(null);
    setCalories(0);
    setCheckoutComplete(false);
    fetchActiveSession();
  };

  // ═══════════════════════════════════════════════
  // 1. Checkout Complete
  // ═══════════════════════════════════════════════
  if (checkoutComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <View style={styles.completeCircle}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
          </View>
          <Text style={styles.completeTitle}>Workout Complete!</Text>
          <Text style={styles.completeSubtitle}>Great job! Keep the streak going.</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Session Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{elapsed}</Text>
            </View>
            {selectedWorkout && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Workout</Text>
                <Text style={styles.summaryValue}>{selectedWorkout}</Text>
              </View>
            )}
            {calories > 0 && (
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>Calories</Text>
                <Text style={styles.summaryValue}>{calories} kcal</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={resetAll} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.accent, COLORS.accentDim]} style={styles.doneBtnGradient}>
              <Text style={styles.doneBtnText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════
  // 2. Checkout Form
  // ═══════════════════════════════════════════════
  if (showCheckout && activeSession) {
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.checkoutContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.checkoutTitle}>End Workout</Text>
        <Text style={styles.checkoutSubtitle}>
          {(activeSession.gym as any)?.name ?? 'Gym'} · {elapsed}
        </Text>

        <Text style={styles.sectionLabel}>What did you do?</Text>
        <View style={styles.workoutGrid}>
          {WORKOUT_TYPES.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[styles.workoutChip, selectedWorkout === w.id && styles.workoutChipActive]}
              onPress={() => setSelectedWorkout(w.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.workoutChipIcon}>{w.icon}</Text>
              <Text style={[styles.workoutChipLabel, selectedWorkout === w.id && styles.workoutChipLabelActive]}>
                {w.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Estimated calories burned</Text>
        <View style={styles.calorieRow}>
          {[150, 250, 350, 500].map((cal) => (
            <TouchableOpacity
              key={cal}
              style={[styles.calorieChip, calories === cal && styles.calorieChipActive]}
              onPress={() => setCalories(cal === calories ? 0 : cal)}
            >
              <Text style={[styles.calorieChipText, calories === cal && styles.calorieChipTextActive]}>
                {cal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.calorieHint}>kcal (approximate — tap to select, tap again to deselect)</Text>

        <TouchableOpacity style={styles.checkoutBtn} onPress={confirmCheckout} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={[COLORS.orange, '#FF4500']} style={styles.checkoutBtnGradient}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.checkoutBtnText}>End Workout & Check Out</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCheckout(false)}>
          <Text style={styles.cancelBtnText}>← Keep Working Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ═══════════════════════════════════════════════
  // 3. Active Session (with checkout button)
  // ═══════════════════════════════════════════════
  if (activeSession && !scanResult) {
    return (
      <View style={styles.container}>
        <View style={styles.activeCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Session Active</Text>
          </View>

          <Text style={styles.activeEmoji}>💪</Text>
          <Text style={styles.activeGym}>{(activeSession.gym as any)?.name ?? 'Gym'}</Text>
          <Text style={styles.activeArea}>
            {(activeSession.gym as any)?.area ?? ''}{(activeSession.gym as any)?.city ? `, ${(activeSession.gym as any).city}` : ''}
          </Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Elapsed Time</Text>
            <Text style={styles.timerValue}>{elapsed}</Text>
          </View>

          <Text style={styles.startedAt}>
            Checked in at{' '}
            {new Date(activeSession.checked_in_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          <TouchableOpacity style={styles.checkoutMainBtn} onPress={handleCheckout} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.orange, '#FF4500']} style={styles.checkoutMainGradient}>
              <Text style={styles.checkoutMainText}>🏁 End Workout & Check Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewGymLink} onPress={() => navigation.navigate('GymDetail', { gymId: activeSession.gym_id })}>
            <Text style={styles.viewGymLinkText}>View Gym Details →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════
  // 4. Check-in Success
  // ═══════════════════════════════════════════════
  if (scanResult) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <View style={styles.successCircle}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Checked In!</Text>
          <Text style={styles.successGym}>{scanResult.gymName}</Text>
          <Text style={styles.successTime}>
            Session started at{' '}
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>

          <TouchableOpacity
            style={styles.viewGymBtn}
            onPress={() => {
              setScanResult(null);
              fetchActiveSession();
            }}
          >
            <LinearGradient colors={[COLORS.accent, COLORS.accentDim]} style={styles.viewGymGradient}>
              <Text style={styles.viewGymText}>View Active Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════
  // 5. Camera Permission
  // ═══════════════════════════════════════════════
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionDesc}>
            We need camera access to scan the QR code at the gym entrance for digital check-in.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <LinearGradient colors={[COLORS.accent, COLORS.accentDim]} style={styles.permissionGradient}>
              <Text style={styles.permissionBtnText}>Enable Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════
  // 6. QR Scanner
  // ═══════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Check-in</Text>
      <Text style={styles.subtitle}>Scan the QR code at the gym entrance</Text>

      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            {!scanned && <Animated.View style={[styles.scanLine, animatedScanLine]} />}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {loading && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator color={COLORS.accent} size="large" />
                <Text style={styles.scanningText}>Verifying...</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.hint}>Position the QR code within the frame. The scan will happen automatically.</Text>
    </View>
  );
}

function parseQRData(data: string): string | null {
  // Format 1: fitpass://gym/{gymId} (owner-generated QR)
  const gymMatch = data.match(/fitpass:\/\/gym\/(.+)/);
  if (gymMatch) return gymMatch[1];
  // Format 2: fitpass://checkin/{gymId} (legacy)
  const checkinMatch = data.match(/fitpass:\/\/checkin\/(.+)/);
  if (checkinMatch) return checkinMatch[1];
  // Format 3: https://fitpass.app/checkin/{gymId}
  const urlMatch = data.match(/fitpass\.app\/checkin\/(.+)/);
  if (urlMatch) return urlMatch[1];
  // Format 4: https://fitpass.app/gym/{gymId}
  const urlGymMatch = data.match(/fitpass\.app\/gym\/(.+)/);
  if (urlGymMatch) return urlGymMatch[1];
  // Format 5: Raw UUID (for development)
  const uuidMatch = data.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  if (uuidMatch) return data;
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bg, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: SPACING.xl,
  },
  scrollContainer: { flex: 1, backgroundColor: COLORS.bg },
  checkoutContent: { paddingHorizontal: SPACING.xl, paddingTop: 20, paddingBottom: 40 },

  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 30, textAlign: 'center' },

  // Scanner
  scannerContainer: { width: 280, height: 280, borderRadius: RADIUS.xxl, overflow: 'hidden', position: 'relative' },
  camera: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 220, height: 220, position: 'relative' },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: COLORS.accent, borderRadius: 2,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10,
  },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.accent, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
  },
  scanningText: { color: COLORS.accent, fontSize: 14, fontWeight: '600', marginTop: 12 },
  hint: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 24, paddingHorizontal: 20 },

  // Active Session
  activeCard: {
    alignItems: 'center', padding: 28, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl, borderWidth: 1, borderColor: COLORS.border,
    width: '100%', ...SHADOWS.elevated,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  liveDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success,
    shadowColor: COLORS.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
  },
  liveText: { fontSize: 13, fontWeight: '700', color: COLORS.success, letterSpacing: 0.5, textTransform: 'uppercase' },
  activeEmoji: { fontSize: 56, marginBottom: 12 },
  activeGym: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  activeArea: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  timerContainer: {
    marginTop: 24, marginBottom: 8, alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, paddingVertical: 20, paddingHorizontal: 40,
    borderWidth: 1, borderColor: COLORS.border,
  },
  timerLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  timerValue: { fontSize: 42, fontWeight: '800', color: COLORS.accent, fontVariant: ['tabular-nums'] },
  startedAt: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, marginBottom: 24 },
  checkoutMainBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', width: '100%' },
  checkoutMainGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  checkoutMainText: { fontSize: 16, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  viewGymLink: { marginTop: 16 },
  viewGymLinkText: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },

  // Checkout Form
  checkoutTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  checkoutSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 28 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14, marginTop: 8 },
  workoutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  workoutChip: {
    flexBasis: '22%', flexGrow: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, borderWidth: 1.5, borderColor: COLORS.border,
  },
  workoutChipActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentGlow },
  workoutChipIcon: { fontSize: 24, marginBottom: 6 },
  workoutChipLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  workoutChipLabelActive: { color: COLORS.accent },
  calorieRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  calorieChip: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, borderWidth: 1.5, borderColor: COLORS.border,
  },
  calorieChipActive: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeGlow },
  calorieChipText: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  calorieChipTextActive: { color: COLORS.orange },
  calorieHint: { fontSize: 11, color: COLORS.textMuted, marginBottom: 28 },
  checkoutBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  checkoutBtnGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  checkoutBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  cancelBtn: {
    paddingVertical: 16, alignItems: 'center', marginTop: 14,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },

  // Success / Complete
  successCard: { alignItems: 'center', padding: 20, width: '100%' },
  successCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: `${COLORS.success}15`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: `${COLORS.success}30`,
  },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.success, marginBottom: 6 },
  successGym: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  successTime: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  viewGymBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', width: '100%', marginTop: 28 },
  viewGymGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: RADIUS.lg },
  viewGymText: { fontSize: 15, fontWeight: '700', color: COLORS.bg },
  completeCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: `${COLORS.accent}30`,
  },
  completeTitle: { fontSize: 24, fontWeight: '800', color: COLORS.accent, marginBottom: 4 },
  completeSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  summaryCard: {
    width: '100%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  doneBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', width: '100%' },
  doneBtnGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.bg, letterSpacing: 0.5 },

  // Permission
  permissionCard: { alignItems: 'center', padding: 32 },
  permissionEmoji: { fontSize: 56, marginBottom: 20 },
  permissionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  permissionDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  permissionBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', width: '100%' },
  permissionGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: RADIUS.lg },
  permissionBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.bg },
});
