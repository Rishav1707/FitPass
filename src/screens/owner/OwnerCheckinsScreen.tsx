// ─────────────────────────────────────────────────
// Owner Check-ins Screen — View Member Check-ins
// ─────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../../context/store';
import { ownerService } from '../../services/owner';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import type { CheckIn, Gym } from '../../types';

export default function OwnerCheckinsScreen() {
  const ownedGyms = useAppStore((s) => s.ownedGyms);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ownedGyms.length > 0 && !selectedGym) {
      setSelectedGym(ownedGyms[0]);
    }
  }, [ownedGyms]);

  useEffect(() => {
    if (selectedGym) loadCheckins(selectedGym.id);
  }, [selectedGym]);

  const loadCheckins = async (gymId: string) => {
    setLoading(true);
    try {
      const data = await ownerService.getGymCheckins(gymId);
      setCheckins(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check-ins</Text>

      {/* Gym Selector */}
      {ownedGyms.length > 1 && (
        <FlatList
          horizontal
          data={ownedGyms}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.gymTab, selectedGym?.id === item.id && styles.gymTabActive]}
              onPress={() => setSelectedGym(item)}
            >
              <Text style={[styles.gymTabText, selectedGym?.id === item.id && styles.gymTabTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gymTabs}
        />
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.premium} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={checkins}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.checkinCard}>
              <View style={styles.checkinLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {((item as any).user?.full_name ?? 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.memberName}>{(item as any).user?.full_name ?? 'Member'}</Text>
                  <Text style={styles.checkinTime}>
                    {new Date(item.checked_in_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.checkinRight}>
                {item.checked_out_at ? (
                  <>
                    <Text style={styles.duration}>{item.duration_minutes ?? '—'} min</Text>
                    <View style={styles.statusCheckedOut}><Text style={styles.statusText}>Completed</Text></View>
                  </>
                ) : (
                  <View style={styles.statusActive}><Text style={styles.statusActiveText}>Active</Text></View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No check-ins yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },

  gymTabs: { marginBottom: SPACING.lg, paddingRight: 20 },
  gymTab: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  gymTabActive: { borderColor: COLORS.premium, backgroundColor: COLORS.premiumGlow },
  gymTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  gymTabTextActive: { color: COLORS.premium },

  checkinCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, ...SHADOWS.card,
  },
  checkinLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.accentGlow2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.accent },
  memberName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  checkinTime: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  checkinRight: { alignItems: 'flex-end', gap: 4 },
  duration: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  statusCheckedOut: { backgroundColor: `${COLORS.success}15`, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600', color: COLORS.success },
  statusActive: { backgroundColor: `${COLORS.warning}15`, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  statusActiveText: { fontSize: 10, fontWeight: '600', color: COLORS.warning },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
});
