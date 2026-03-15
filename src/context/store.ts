// ─────────────────────────────────────────────────
// Global State Store (Zustand) — with Role Support
// ─────────────────────────────────────────────────
import { create } from 'zustand';
import type { User, UserRole, Gym, CheckIn, Subscription, WorkoutStats } from '../types';

interface AppState {
  // Auth
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;

  // Gyms
  gyms: Gym[];
  nearbyGyms: Gym[];
  selectedGym: Gym | null;
  ownedGyms: Gym[]; // Gym owner's gyms

  // Check-in
  activeSession: CheckIn | null;
  checkInHistory: CheckIn[];

  // Subscription
  subscription: Subscription | null;

  // Stats
  stats: WorkoutStats | null;
  weeklyStreak: { day: string; completed: boolean }[];

  // Location
  userLocation: { latitude: number; longitude: number } | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  setLoading: (loading: boolean) => void;
  setUserRole: (role: UserRole | null) => void;
  setGyms: (gyms: Gym[]) => void;
  setNearbyGyms: (gyms: Gym[]) => void;
  setSelectedGym: (gym: Gym | null) => void;
  setOwnedGyms: (gyms: Gym[]) => void;
  setActiveSession: (session: CheckIn | null) => void;
  setCheckInHistory: (history: CheckIn[]) => void;
  setSubscription: (sub: Subscription | null) => void;
  setStats: (stats: WorkoutStats | null) => void;
  setWeeklyStreak: (streak: { day: string; completed: boolean }[]) => void;
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  userRole: null,
  gyms: [],
  nearbyGyms: [],
  selectedGym: null,
  ownedGyms: [],
  activeSession: null,
  checkInHistory: [],
  subscription: null,
  stats: null,
  weeklyStreak: [],
  userLocation: null,

  setUser: (user) => set({ user, isAuthenticated: !!user, userRole: user?.role ?? null }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setUserRole: (userRole) => set({ userRole }),
  setGyms: (gyms) => set({ gyms }),
  setNearbyGyms: (nearbyGyms) => set({ nearbyGyms }),
  setSelectedGym: (selectedGym) => set({ selectedGym }),
  setOwnedGyms: (ownedGyms) => set({ ownedGyms }),
  setActiveSession: (activeSession) => set({ activeSession }),
  setCheckInHistory: (checkInHistory) => set({ checkInHistory }),
  setSubscription: (subscription) => set({ subscription }),
  setStats: (stats) => set({ stats }),
  setWeeklyStreak: (weeklyStreak) => set({ weeklyStreak }),
  setUserLocation: (userLocation) => set({ userLocation }),

  logout: () =>
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      userRole: null,
      ownedGyms: [],
      activeSession: null,
      checkInHistory: [],
      subscription: null,
      stats: null,
      weeklyStreak: [],
    }),
}));
