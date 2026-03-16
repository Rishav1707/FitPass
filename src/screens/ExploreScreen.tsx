// ─────────────────────────────────────────────────
// Explore Screen — Search, Filter, Browse Gyms
// ─────────────────────────────────────────────────
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, ScrollView, Keyboard,
} from 'react-native';
import { useGyms, useLocation } from '../hooks';
import { useAppStore } from '../context/store';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import type { Gym } from '../types';

const FILTERS = ['All', 'Premium', 'Standard', 'Nearby', 'Top Rated'] as const;

// Haversine formula — distance between two GPS points in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ExploreScreen({ navigation }: any) {
  const { gyms, fetchGyms, searchGyms, loading } = useGyms();
  const { location } = useLocation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const [results, setResults] = useState<Gym[]>([]);
  const searchRef = useRef<TextInput>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchGyms();
  }, []);

  // Debounced search — waits 400ms after typing stops before filtering
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      applyFilters();
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, filter, gyms]);

  const applyFilters = useCallback(async () => {
    let filtered = gyms;

    if (search.trim()) {
      filtered = await searchGyms(search);
    }

    switch (filter) {
      case 'Premium':
        filtered = filtered.filter((g) => g.gym_type === 'premium');
        break;
      case 'Standard':
        filtered = filtered.filter((g) => g.gym_type === 'standard');
        break;
      case 'Top Rated':
        filtered = filtered.filter((g) => g.rating >= 4.7);
        break;
      case 'Nearby':
        if (location) {
          // Calculate distance for each gym and sort by closest
          filtered = filtered
            .map((g) => ({
              ...g,
              _distance: getDistanceKm(location.latitude, location.longitude, g.latitude, g.longitude),
            }))
            .sort((a, b) => (a as any)._distance - (b as any)._distance)
            .slice(0, 15);
        } else {
          // No location available — prompt user
          filtered = [];
        }
        break;
    }

    setResults(filtered);
  }, [gyms, filter, search]);

  const handleClearSearch = () => {
    setSearch('');
    searchRef.current?.focus();
  };

  const renderGymCard = ({ item: gym }: { item: Gym }) => {
    const distance = (gym as any)._distance;
    return (
    <TouchableOpacity
      style={styles.gymCard}
      onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
      activeOpacity={0.7}
    >
      <View style={styles.gymTop}>
        <View style={[styles.gymIcon, gym.gym_type === 'premium' && styles.gymIconPremium]}>
          <Text style={{ fontSize: 22 }}>🏋️</Text>
        </View>
        <View style={styles.gymInfo}>
          <Text style={styles.gymName}>{gym.name}</Text>
          <Text style={styles.gymArea}>
            {gym.area}, {gym.city}
            {distance != null ? ` · ${distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}` : ''}
          </Text>
        </View>
        {gym.gym_type === 'premium' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
        )}
      </View>

      <View style={styles.gymBottom}>
        <View style={styles.gymStats}>
          <Text style={styles.gymRating}>★ {gym.rating}</Text>
          <Text style={styles.gymReviews}>({gym.review_count})</Text>
          <Text style={styles.gymPrice}>₹{gym.price_per_visit}/visit</Text>
        </View>
        <OccupancyBar value={gym.occupancy_percent} />
      </View>

      <View style={styles.amenitiesRow}>
        {gym.amenities?.slice(0, 4).map((a, i) => (
          <View key={i} style={styles.amenityChip}>
            <Text style={styles.amenityText}>{a}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
  };

  // Filter chips as ListHeader (no TextInput here — it stays fixed above)
  const ListHeader = useCallback(() => (
    <View>
      <Text style={styles.resultCount}>{results.length} gyms found</Text>
    </View>
  ), [results.length]);

  return (
    <View style={styles.container}>
      {/* ── Fixed Header: Title + Search + Filters ── */}
      <Text style={styles.title}>Explore Gyms</Text>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={searchRef}
          style={styles.searchInput}
          placeholder="Search gyms, areas..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit={false}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          keyboardShouldPersistTaps="always"
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Scrollable Gym List ── */}
      {loading ? (
        <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          renderItem={renderGymCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={ListHeader}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{filter === 'Nearby' && !location ? '📍' : '🔍'}</Text>
              <Text style={styles.emptyText}>
                {filter === 'Nearby' && !location ? 'Location not available' : 'No gyms found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {filter === 'Nearby' && !location
                  ? 'Please enable location services to find gyms near you'
                  : 'Try adjusting your search or filters'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function OccupancyBar({ value }: { value: number }) {
  const color = value < 40 ? COLORS.success : value < 70 ? COLORS.warning : COLORS.danger;
  return (
    <View style={styles.occupancy}>
      <View style={styles.occupancyTrack}>
        <View style={[styles.occupancyFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.occupancyText, { color }]}>{value}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, marginBottom: SPACING.lg,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: COLORS.textPrimary },
  clearBtn: { fontSize: 16, color: COLORS.textMuted, padding: 4 },

  filterContainer: {
    height: 44,
    marginBottom: SPACING.lg,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
  },
  filterChip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
    marginRight: 8,
  },
  filterChipActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentGlow },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.accent, fontWeight: '700' },

  resultCount: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.md },

  gymCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  gymTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  gymIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accentGlow2,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  gymIconPremium: { backgroundColor: COLORS.premiumGlow },
  gymInfo: { flex: 1 },
  gymName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  gymArea: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  badge: { backgroundColor: COLORS.premiumGlow, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '700', color: COLORS.premium, letterSpacing: 0.5 },

  gymBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gymStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gymRating: { fontSize: 12, color: COLORS.warning },
  gymReviews: { fontSize: 11, color: COLORS.textMuted },
  gymPrice: { fontSize: 11, color: COLORS.textSecondary },

  occupancy: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  occupancyTrack: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, overflow: 'hidden' },
  occupancyFill: { height: '100%', borderRadius: 2 },
  occupancyText: { fontSize: 10, fontWeight: '600' },

  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenityChip: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: COLORS.accentGlow2, borderWidth: 1, borderColor: `${COLORS.accent}20`,
  },
  amenityText: { fontSize: 10, color: COLORS.accent, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptySubtext: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
});
