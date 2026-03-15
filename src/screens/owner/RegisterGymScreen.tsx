// ─────────────────────────────────────────────────
// Register Gym Screen — Auto Location + Time Picker
// ─────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Modal, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../context/store';
import { ownerService } from '../../services/owner';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const ALL_AMENITIES = [
  'AC', 'Parking', 'Pool', 'Sauna', 'Steam', 'Spa', 'Cafe',
  'Weights', 'Cardio', 'CrossFit', 'Yoga', 'Boxing', 'MMA',
  'Meditation', 'Zumba', 'Pilates', 'Personal Training', 'Locker',
  'Shower', 'WiFi', 'Towels', 'Supplements Shop',
];

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Chennai'];

// Generate time options from 12 AM to 11:30 PM in 30-min intervals
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ['00', '30']) {
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? 'AM' : 'PM';
    TIME_OPTIONS.push(`${hour12}:${m} ${ampm}`);
  }
}

// ─── Time Picker Modal ──────────────────────────
function TimePicker({
  visible,
  title,
  onSelect,
  onClose,
  selectedValue,
}: {
  visible: boolean;
  title: string;
  onSelect: (time: string) => void;
  onClose: () => void;
  selectedValue: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tpStyles.overlay}>
        <View style={tpStyles.sheet}>
          <View style={tpStyles.header}>
            <Text style={tpStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={tpStyles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={tpStyles.list} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[tpStyles.option, selectedValue === time && tpStyles.optionActive]}
                onPress={() => { onSelect(time); onClose(); }}
              >
                <Text style={[tpStyles.optionText, selectedValue === time && tpStyles.optionTextActive]}>
                  {time}
                </Text>
                {selectedValue === time && <Text style={tpStyles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const tpStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '60%', paddingBottom: 40,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  closeBtn: { fontSize: 18, color: COLORS.textMuted, padding: 4 },
  list: { paddingHorizontal: 12 },
  option: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginTop: 4,
  },
  optionActive: { backgroundColor: COLORS.premiumGlow },
  optionText: { fontSize: 15, color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.premium, fontWeight: '700' },
  checkmark: { fontSize: 16, color: COLORS.premium, fontWeight: '700' },
});

// ─── Main Screen ────────────────────────────────
export default function RegisterGymScreen({ navigation }: any) {
  const user = useAppStore((s) => s.user);
  const setOwnedGyms = useAppStore((s) => s.setOwnedGyms);
  const ownedGyms = useAppStore((s) => s.ownedGyms);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);

  const [form, setForm] = useState({
    name: '',
    area: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    description: '',
    openTime: '6:00 AM',
    closeTime: '10:00 PM',
    price_per_visit: '',
    gym_type: 'standard' as 'standard' | 'premium',
  });
  const [amenities, setAmenities] = useState<string[]>([]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  // ─── Auto-detect Location ───────────────────────
  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to auto-detect your gym location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      updateField('latitude', lat.toFixed(6));
      updateField('longitude', lng.toFixed(6));

      // Reverse geocode to get address
      const [geocode] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });

      if (geocode) {
        const addressParts = [
          geocode.name,
          geocode.street,
          geocode.district,
          geocode.subregion,
        ].filter(Boolean);

        const fullAddress = addressParts.join(', ');

        setForm((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
          address: fullAddress || prev.address,
          area: geocode.district || geocode.subregion || prev.area,
          city: matchCity(geocode.city || geocode.region || '') || prev.city,
        }));

        Alert.alert('📍 Location Detected', `${fullAddress}\n\nLat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
      }
    } catch (err: any) {
      Alert.alert('Location Error', 'Could not detect location. Please enter manually.');
      console.error(err);
    } finally {
      setLocationLoading(false);
    }
  };

  // Match detected city to our supported cities
  const matchCity = (detected: string): string => {
    const lower = detected.toLowerCase();
    for (const city of CITIES) {
      if (lower.includes(city.toLowerCase())) return city;
    }
    return '';
  };

  // ─── Submit ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name || !form.area || !form.city || !form.address || !form.price_per_visit) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (Name, Area, City, Address, Price).');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const hours = `${form.openTime} - ${form.closeTime}`;

      const newGym = await ownerService.registerGym(user.id, {
        name: form.name,
        area: form.area,
        city: form.city,
        address: form.address,
        latitude: parseFloat(form.latitude) || 17.385,
        longitude: parseFloat(form.longitude) || 78.4867,
        gym_type: form.gym_type,
        price_per_visit: parseInt(form.price_per_visit) || 50,
        amenities,
        hours,
        phone: form.phone || undefined,
        email: form.email || undefined,
        description: form.description || undefined,
      });

      setOwnedGyms([newGym, ...ownedGyms]);
      Alert.alert('🎉 Gym Registered!', `${form.name} has been added to FitPass.`, [
        { text: 'Great!', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Register Your Gym</Text>
      <Text style={styles.subtitle}>Fill in the details to list your gym on FitPass</Text>

      {/* ── Basic Info ── */}
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gym Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Iron Paradise" placeholderTextColor={COLORS.textMuted} value={form.name} onChangeText={(v) => updateField('name', v)} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Tell members what makes your gym special..." placeholderTextColor={COLORS.textMuted} value={form.description} onChangeText={(v) => updateField('description', v)} multiline numberOfLines={3} textAlignVertical="top" />
      </View>

      {/* ── Gym Type ── */}
      <Text style={styles.sectionTitle}>Gym Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeBtn, form.gym_type === 'standard' && styles.typeBtnActive]} onPress={() => updateField('gym_type', 'standard')}>
          <Text style={styles.typeIcon}>💪</Text>
          <Text style={[styles.typeLabel, form.gym_type === 'standard' && styles.typeLabelActive]}>Standard</Text>
          <Text style={styles.typeDesc}>Basic equipment & facilities</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, form.gym_type === 'premium' && styles.typeBtnPremiumActive]} onPress={() => updateField('gym_type', 'premium')}>
          <Text style={styles.typeIcon}>👑</Text>
          <Text style={[styles.typeLabel, form.gym_type === 'premium' && { color: COLORS.premium }]}>Premium</Text>
          <Text style={styles.typeDesc}>Full amenities & services</Text>
        </TouchableOpacity>
      </View>

      {/* ── Location ── */}
      <Text style={styles.sectionTitle}>Location</Text>

      {/* Auto-detect button */}
      <TouchableOpacity style={styles.detectBtn} onPress={detectLocation} disabled={locationLoading} activeOpacity={0.7}>
        <LinearGradient colors={['#1A2038', '#131829']} style={styles.detectGradient}>
          {locationLoading ? (
            <ActivityIndicator color={COLORS.accent} size="small" />
          ) : (
            <Text style={styles.detectIcon}>📍</Text>
          )}
          <View style={styles.detectContent}>
            <Text style={styles.detectTitle}>
              {locationLoading ? 'Detecting location...' : 'Use Current Location'}
            </Text>
            <Text style={styles.detectDesc}>
              Auto-fill address, area, city, and coordinates
            </Text>
          </View>
          {!locationLoading && <Text style={styles.detectArrow}>→</Text>}
        </LinearGradient>
      </TouchableOpacity>

      {/* Coordinates display */}
      {(form.latitude || form.longitude) ? (
        <View style={styles.coordsCard}>
          <Text style={styles.coordsLabel}>📌 Coordinates</Text>
          <Text style={styles.coordsValue}>
            {form.latitude}, {form.longitude}
          </Text>
          <TouchableOpacity onPress={() => { updateField('latitude', ''); updateField('longitude', ''); }}>
            <Text style={styles.coordsClear}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Manual coordinate entry (collapsed by default) */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput style={styles.input} placeholder="17.385044" placeholderTextColor={COLORS.textMuted} value={form.latitude} onChangeText={(v) => updateField('latitude', v)} keyboardType="decimal-pad" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput style={styles.input} placeholder="78.486671" placeholderTextColor={COLORS.textMuted} value={form.longitude} onChangeText={(v) => updateField('longitude', v)} keyboardType="decimal-pad" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>City *</Text>
        <View style={styles.cityGrid}>
          {CITIES.map((c) => (
            <TouchableOpacity key={c} style={[styles.cityChip, form.city === c && styles.cityChipActive]} onPress={() => updateField('city', c)}>
              <Text style={[styles.cityChipText, form.city === c && styles.cityChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Area / Locality *</Text>
        <TextInput style={styles.input} placeholder="e.g. Banjara Hills" placeholderTextColor={COLORS.textMuted} value={form.area} onChangeText={(v) => updateField('area', v)} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Address *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Complete address for users to find your gym" placeholderTextColor={COLORS.textMuted} value={form.address} onChangeText={(v) => updateField('address', v)} multiline numberOfLines={2} textAlignVertical="top" />
      </View>

      {/* ── Operating Hours (Time Pickers) ── */}
      <Text style={styles.sectionTitle}>Operating Hours</Text>

      <View style={styles.hoursRow}>
        <TouchableOpacity style={styles.timePicker} onPress={() => setShowOpenPicker(true)} activeOpacity={0.7}>
          <Text style={styles.timePickerLabel}>Opens at</Text>
          <Text style={styles.timePickerValue}>{form.openTime}</Text>
          <Text style={styles.timePickerIcon}>🕐</Text>
        </TouchableOpacity>

        <View style={styles.hoursDivider}>
          <Text style={styles.hoursDividerText}>to</Text>
        </View>

        <TouchableOpacity style={styles.timePicker} onPress={() => setShowClosePicker(true)} activeOpacity={0.7}>
          <Text style={styles.timePickerLabel}>Closes at</Text>
          <Text style={styles.timePickerValue}>{form.closeTime}</Text>
          <Text style={styles.timePickerIcon}>🕙</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hoursPreview}>
        Operating: {form.openTime} — {form.closeTime}
      </Text>

      {/* Time Picker Modals */}
      <TimePicker
        visible={showOpenPicker}
        title="Opening Time"
        selectedValue={form.openTime}
        onSelect={(time) => updateField('openTime', time)}
        onClose={() => setShowOpenPicker(false)}
      />
      <TimePicker
        visible={showClosePicker}
        title="Closing Time"
        selectedValue={form.closeTime}
        onSelect={(time) => updateField('closeTime', time)}
        onClose={() => setShowClosePicker(false)}
      />

      {/* ── Pricing ── */}
      <Text style={styles.sectionTitle}>Pricing</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Price per Visit (₹) *</Text>
        <View style={styles.priceInputWrap}>
          <Text style={styles.pricePrefix}>₹</Text>
          <TextInput style={styles.priceInput} placeholder="80" placeholderTextColor={COLORS.textMuted} value={form.price_per_visit} onChangeText={(v) => updateField('price_per_visit', v)} keyboardType="number-pad" />
          <Text style={styles.priceSuffix}>per visit</Text>
        </View>
      </View>

      {/* Quick price presets */}
      <View style={styles.pricePresetsRow}>
        {[50, 80, 100, 150, 200].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.pricePreset, form.price_per_visit === String(p) && styles.pricePresetActive]}
            onPress={() => updateField('price_per_visit', String(p))}
          >
            <Text style={[styles.pricePresetText, form.price_per_visit === String(p) && styles.pricePresetTextActive]}>
              ₹{p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Contact ── */}
      <Text style={styles.sectionTitle}>Contact Details</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor={COLORS.textMuted} value={form.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="gym@email.com" placeholderTextColor={COLORS.textMuted} value={form.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
        </View>
      </View>

      {/* ── Amenities ── */}
      <Text style={styles.sectionTitle}>Amenities</Text>
      <Text style={styles.amenityHint}>Select all that apply ({amenities.length} selected)</Text>
      <View style={styles.amenityGrid}>
        {ALL_AMENITIES.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.amenityChip, amenities.includes(a) && styles.amenityChipActive]}
            onPress={() => toggleAmenity(a)}
          >
            <Text style={[styles.amenityText, amenities.includes(a) && styles.amenityTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Submit ── */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
        <LinearGradient colors={[COLORS.premium, '#B8922E']} style={styles.submitGradient}>
          {loading ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.submitText}>Register Gym on FitPass</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 40 },
  backBtn: { marginBottom: SPACING.lg },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.premium },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xxl },

  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.textPrimary,
    marginTop: SPACING.xl, marginBottom: SPACING.md,
    paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },

  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 14,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { minHeight: 70, paddingTop: 14 },
  row: { flexDirection: 'row', gap: SPACING.md },

  // Gym Type
  typeRow: { flexDirection: 'row', gap: SPACING.md },
  typeBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 2, borderColor: COLORS.border, alignItems: 'center',
  },
  typeBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentGlow },
  typeBtnPremiumActive: { borderColor: COLORS.premium, backgroundColor: COLORS.premiumGlow },
  typeIcon: { fontSize: 28, marginBottom: 8 },
  typeLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  typeLabelActive: { color: COLORS.accent },
  typeDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Location detect
  detectBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.lg },
  detectGradient: {
    flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.accent,
  },
  detectIcon: { fontSize: 28 },
  detectContent: { flex: 1 },
  detectTitle: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  detectDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  detectArrow: { fontSize: 18, color: COLORS.accent, fontWeight: '600' },

  // Coords display
  coordsCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: `${COLORS.success}10`,
    borderRadius: RADIUS.md, padding: 12, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: `${COLORS.success}25`, gap: 8,
  },
  coordsLabel: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  coordsValue: { flex: 1, fontSize: 12, color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  coordsClear: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },

  // City
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  cityChip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  cityChipActive: { borderColor: COLORS.premium, backgroundColor: COLORS.premiumGlow },
  cityChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  cityChipTextActive: { color: COLORS.premium, fontWeight: '700' },

  // Operating Hours
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timePicker: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', ...SHADOWS.card,
  },
  timePickerLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  timePickerValue: { fontSize: 20, fontWeight: '800', color: COLORS.premium },
  timePickerIcon: { marginTop: 6, fontSize: 16 },
  hoursDivider: { paddingHorizontal: 4 },
  hoursDividerText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  hoursPreview: {
    fontSize: 13, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: SPACING.md, marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },

  // Pricing
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  pricePrefix: {
    fontSize: 20, fontWeight: '800', color: COLORS.premium,
    paddingLeft: 16, paddingRight: 4,
  },
  priceInput: {
    flex: 1, padding: 14, fontSize: 20, fontWeight: '700', color: COLORS.textPrimary,
  },
  priceSuffix: { fontSize: 12, color: COLORS.textMuted, paddingRight: 16 },

  pricePresetsRow: { flexDirection: 'row', gap: 8, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  pricePreset: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  pricePresetActive: { borderColor: COLORS.premium, backgroundColor: COLORS.premiumGlow },
  pricePresetText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  pricePresetTextActive: { color: COLORS.premium, fontWeight: '700' },

  // Amenities
  amenityHint: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.md },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  amenityChipActive: { borderColor: COLORS.premium, backgroundColor: COLORS.premiumGlow },
  amenityText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  amenityTextActive: { color: COLORS.premium, fontWeight: '700' },

  // Submit
  submitBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.xxl },
  submitGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADIUS.lg },
  submitText: { fontSize: 16, fontWeight: '800', color: COLORS.bg, letterSpacing: 0.5 },
});
