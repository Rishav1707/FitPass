// ─────────────────────────────────────────────────
// Login Screen — Role-Aware
// ─────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import type { UserRole } from '../types';

export default function LoginScreen({ navigation, route }: any) {
  const role: UserRole = route.params?.role ?? 'user';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useAuth();

  const isOwner = role === 'gym_owner';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await signIn(email, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inner}>
          {/* Back to role select */}
          <TouchableOpacity onPress={() => navigation.navigate('RoleSelect')} style={styles.backBtn}>
            <Text style={styles.backText}>← Change role</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={isOwner ? [COLORS.premium, '#B8922E'] : [COLORS.accent, COLORS.accentDim]}
              style={styles.logoCircle}
            >
              <Text style={styles.logoText}>{isOwner ? '🏢' : '🏃'}</Text>
            </LinearGradient>
            <Text style={styles.brandName}>
              {isOwner ? 'Gym Owner Portal' : 'FitPass'}
            </Text>
            <View style={[styles.roleBadge, isOwner && styles.roleBadgeOwner]}>
              <Text style={[styles.roleBadgeText, isOwner && styles.roleBadgeTextOwner]}>
                {isOwner ? '🏢 GYM OWNER' : '🏃 FITNESS USER'}
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={[styles.loginBtn, isLoading && { opacity: 0.6 }]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
              <LinearGradient
                colors={isOwner ? [COLORS.premium, '#B8922E'] : [COLORS.accent, COLORS.accentDim]}
                style={styles.loginGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.bg} />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register', { role })}>
              <Text style={[styles.footerLink, isOwner && { color: COLORS.premium }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  keyboardView: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  backBtn: { position: 'absolute', top: 10, left: 0 },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  logoText: { fontSize: 28 },
  brandName: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  roleBadge: {
    paddingVertical: 4, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: `${COLORS.accent}30`,
  },
  roleBadgeOwner: { backgroundColor: COLORS.premiumGlow, borderColor: `${COLORS.premium}30` },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  roleBadgeTextOwner: { color: COLORS.premium },
  form: { gap: SPACING.lg },
  inputWrapper: { gap: SPACING.sm },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  loginBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.sm },
  loginGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.bg, letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerLink: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
});
