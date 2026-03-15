// ─────────────────────────────────────────────────
// FitPass — App Entry Point
// ─────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from './src/hooks';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/theme';

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Hide splash as soon as auth check is done
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} translucent />
      <AppNavigator isAuthenticated={isAuthenticated} userRole={user?.role ?? null} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
