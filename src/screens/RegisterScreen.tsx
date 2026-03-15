// ─────────────────────────────────────────────────
// Register Screen — Role-Aware
// ─────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import type { UserRole } from '../types';

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Chennai'];

export default function RegisterScreen({ navigation, route }: any) {
  const role: UserRole = route.params?.role ?? 'user';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const { signUp, isLoading } = useAuth();

  const isOwner = role === 'gym_owner';
  const accentColor = isOwner ? COLORS.premium : COLORS.accent;

  const handleRegister = async () => {
    if (!fullName || !email || !password || !city) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    try {
      await signUp(email, password, fullName, city, role);
      Alert.alert('Success', 'Account created! You can now sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login', { role }) },
      ]);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {isOwner ? 'Register as Gym Owner' : 'Create Account'}
          </Text>
          <View style={[styles.roleBadge, isOwner && styles.roleBadgeOwner]}>
            <Text style={[styles.roleBadgeText, isOwner && styles.roleBadgeTextOwner]}>
              {isOwner ? '🏢 GYM OWNER' : '🏃 FITNESS USER'}
            </Text>
          </View>
          <Text style={styles.subtitle}>
            {isOwner
              ? 'Create your account to start registering your gyms on FitPass'
              : 'Join 50,000+ fitness enthusiasts on FitPass'}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{isOwner ? 'Owner Name' : 'Full Name'}</Text>
              <TextInput style={styles.input} placeholder={isOwner ? 'John Doe' : 'Rahul Sharma'} placeholderTextColor={COLORS.textMuted} value={fullName} onChangeText={setFullName} />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.input} placeholder="Minimum 8 characters" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{isOwner ? 'Primary City' : 'City'}</Text>
              <View style={styles.cityGrid}>
                {CITIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityChip, city === c && { borderColor: accentColor, backgroundColor: `${accentColor}15` }]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={[styles.cityChipText, city === c && { color: accentColor, fontWeight: '700' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.registerBtn, isLoading && { opacity: 0.6 }]} onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
              <LinearGradient colors={isOwner ? [COLORS.premium, '#B8922E'] : [COLORS.accent, COLORS.accentDim]} style={styles.registerGradient}>
                {isLoading ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.registerBtnText}>Create Account</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login', { role })}>
              <Text style={[styles.footerLink, isOwner && { color: COLORS.premium }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  keyboardView: { flex: 1 },
  inner: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: 20, paddingBottom: 40 },
  backBtn: { marginBottom: SPACING.xl },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  roleBadge: {
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: `${COLORS.accent}30`, marginBottom: SPACING.md,
  },
  roleBadgeOwner: { backgroundColor: COLORS.premiumGlow, borderColor: `${COLORS.premium}30` },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  roleBadgeTextOwner: { color: COLORS.premium },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 28 },
  form: { gap: SPACING.xl },
  inputWrapper: { gap: SPACING.sm },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  cityChip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  cityChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  registerBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.sm },
  registerGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  registerBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.bg, letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerLink: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
});
