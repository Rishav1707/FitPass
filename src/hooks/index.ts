// ─────────────────────────────────────────────────
// Custom Hooks
// ─────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { useAppStore } from '../context/store';
import { authService } from '../services/auth';
import { gymService } from '../services/gym';
import { checkinService } from '../services/checkin';
import { subscriptionService } from '../services/subscription';

// ─── Auth Hook ──────────────────────────────────
export function useAuth() {
  const { setUser, setSession, setLoading, logout, user, session, isAuthenticated, isLoading } =
    useAppStore();

  useEffect(() => {
    // Check existing session on mount
    const initAuth = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user) {
          setSession(session);
          const profile = await authService.getProfile(session.user.id);
          setUser(profile);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: listener } = authService.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          const profile = await authService.getProfile(session.user.id);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          logout();
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authService.signIn(email, password);
      setSession(data.session);
      const profile = await authService.getProfile(data.user.id);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, city: string, role: 'user' | 'gym_owner' = 'user') => {
      setLoading(true);
      try {
        await authService.signUp(email, password, fullName, city, role);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    logout();
  }, []);

  return { user, session, isAuthenticated, isLoading, signIn, signUp, signOut };
}

// ─── Location Hook ──────────────────────────────
export function useLocation() {
  const { userLocation, setUserLocation } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      setError('Could not get location');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, []);

  return { location: userLocation, error, refresh: requestLocation };
}

// ─── Gyms Hook ──────────────────────────────────
export function useGyms() {
  const { gyms, nearbyGyms, setGyms, setNearbyGyms, userLocation } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGyms = useCallback(async (city?: string) => {
    setLoading(true);
    try {
      const data = await gymService.getGyms(city);
      setGyms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNearbyGyms = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const data = await gymService.getNearbyGyms(
        userLocation.latitude,
        userLocation.longitude
      );
      setNearbyGyms(data);
    } catch (err: any) {
      // Fallback: fetch all gyms if geolocation query fails
      const data = await gymService.getGyms();
      setNearbyGyms(data.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  const searchGyms = useCallback(async (query: string) => {
    try {
      return await gymService.searchGyms(query);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  return { gyms, nearbyGyms, loading, error, fetchGyms, fetchNearbyGyms, searchGyms };
}

// ─── Check-in Hook ──────────────────────────────
export function useCheckIn() {
  const { user, activeSession, setActiveSession, checkInHistory, setCheckInHistory } =
    useAppStore();
  const [loading, setLoading] = useState(false);

  const performCheckIn = useCallback(
    async (gymId: string) => {
      if (!user) throw new Error('Not authenticated');
      setLoading(true);
      try {
        const session = await checkinService.checkIn(user.id, gymId);
        setActiveSession(session);
        return session;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const performCheckOut = useCallback(
    async (workoutType?: string, calories?: number) => {
      if (!activeSession) throw new Error('No active session');
      setLoading(true);
      try {
        await checkinService.checkOut(activeSession.id, workoutType, calories);
        setActiveSession(null);
        // Refresh history
        if (user) {
          const history = await checkinService.getHistory(user.id);
          setCheckInHistory(history);
        }
      } finally {
        setLoading(false);
      }
    },
    [activeSession, user]
  );

  const fetchActiveSession = useCallback(async () => {
    if (!user) return;
    try {
      const session = await checkinService.getActiveSession(user.id);
      setActiveSession(session);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const history = await checkinService.getHistory(user.id);
      setCheckInHistory(history);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  return {
    activeSession,
    checkInHistory,
    loading,
    performCheckIn,
    performCheckOut,
    fetchActiveSession,
    fetchHistory,
  };
}

// ─── Stats Hook ─────────────────────────────────
export function useStats() {
  const { user, stats, setStats, weeklyStreak, setWeeklyStreak } = useAppStore();
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [statsData, streakData] = await Promise.all([
        checkinService.getStats(user.id),
        checkinService.getWeeklyStreak(user.id),
      ]);
      setStats(statsData);
      setWeeklyStreak(streakData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { stats, weeklyStreak, loading, fetchStats };
}

// ─── Subscription Hook ──────────────────────────
export function useSubscription() {
  const { user, subscription, setSubscription } = useAppStore();
  const [loading, setLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const sub = await subscriptionService.getActiveSubscription(user.id);
      setSubscription(sub);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const subscribe = useCallback(
    async (planType: 'standard' | 'premium' | 'annual', paymentId: string) => {
      if (!user) throw new Error('Not authenticated');
      setLoading(true);
      try {
        const sub = await subscriptionService.subscribe(user.id, planType, paymentId);
        setSubscription(sub);
        return sub;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { subscription, loading, fetchSubscription, subscribe };
}
