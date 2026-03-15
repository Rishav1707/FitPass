// ─────────────────────────────────────────────────
// Navigation — Role-Based Routing
// Users and Gym Owners see entirely different apps
// ─────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';

// Auth Screens
import RoleSelectScreen from '../screens/RoleSelectScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// User Screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CheckInScreen from '../screens/CheckInScreen';
import PlansScreen from '../screens/PlansScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GymDetailScreen from '../screens/GymDetailScreen';

// Owner Screens
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import RegisterGymScreen from '../screens/owner/RegisterGymScreen';
import OwnerCheckinsScreen from '../screens/owner/OwnerCheckinsScreen';
import OwnerProfileScreen from '../screens/owner/OwnerProfileScreen';
import OwnerGymDetailScreen from '../screens/owner/OwnerGymDetailScreen';
import GymQRCodeScreen from '../screens/owner/GymQRCodeScreen';

import type { RootStackParamList, MainTabParamList, OwnerTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const UserTab = createBottomTabNavigator<MainTabParamList>();
const OwnerTab = createBottomTabNavigator<OwnerTabParamList>();

// ─── SafeArea Wrapper ───────────────────────────
function withSafeArea(ScreenComponent: React.ComponentType<any>) {
  return function SafeScreen(props: any) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScreenComponent {...props} />
      </SafeAreaView>
    );
  };
}

// Wrapped User Screens
const SafeHome = withSafeArea(HomeScreen);
const SafeExplore = withSafeArea(ExploreScreen);
const SafeCheckIn = withSafeArea(CheckInScreen);
const SafePlans = withSafeArea(PlansScreen);
const SafeProfile = withSafeArea(ProfileScreen);
const SafeGymDetail = withSafeArea(GymDetailScreen);

// Wrapped Owner Screens
const SafeOwnerDashboard = withSafeArea(OwnerDashboardScreen);
const SafeOwnerCheckins = withSafeArea(OwnerCheckinsScreen);
const SafeOwnerProfile = withSafeArea(OwnerProfileScreen);
const SafeRegisterGym = withSafeArea(RegisterGymScreen);
const SafeOwnerGymDetail = withSafeArea(OwnerGymDetailScreen);
const SafeGymQRCode = withSafeArea(GymQRCodeScreen);

// ─── User Tab Icons ─────────────────────────────
const USER_TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Explore: '🔍',
  CheckIn: '📷',
  Plans: '💎',
  Profile: '👤',
};

// ─── Owner Tab Icons ────────────────────────────
const OWNER_TAB_ICONS: Record<string, string> = {
  OwnerDashboard: '📊',
  OwnerGyms: '🏋️',
  OwnerCheckins: '📋',
  OwnerProfile: '👤',
};

// ═══════════════════════════════════════════════════
// USER BOTTOM TABS
// ═══════════════════════════════════════════════════
function UserTabs() {
  return (
    <UserTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const icon = USER_TAB_ICONS[route.name];

          if (route.name === 'CheckIn') {
            return (
              <View style={styles.checkInTabIcon}>
                <LinearGradient colors={[COLORS.accent, COLORS.accentDim]} style={styles.checkInGradient}>
                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                </LinearGradient>
              </View>
            );
          }

          return (
            <View style={styles.tabIconWrap}>
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
              {focused && <View style={styles.activeIndicator} />}
            </View>
          );
        },
      })}
    >
      <UserTab.Screen name="Home" component={SafeHome} />
      <UserTab.Screen name="Explore" component={SafeExplore} />
      <UserTab.Screen name="CheckIn" component={SafeCheckIn} options={{ tabBarLabel: 'Check-in' }} />
      <UserTab.Screen name="Plans" component={SafePlans} />
      <UserTab.Screen name="Profile" component={SafeProfile} />
    </UserTab.Navigator>
  );
}

// ═══════════════════════════════════════════════════
// GYM OWNER BOTTOM TABS
// ═══════════════════════════════════════════════════
function OwnerTabs() {
  return (
    <OwnerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.ownerTabBar,
        tabBarActiveTintColor: COLORS.premium,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const icon = OWNER_TAB_ICONS[route.name];
          return (
            <View style={styles.tabIconWrap}>
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
              {focused && <View style={[styles.activeIndicator, { backgroundColor: COLORS.premium }]} />}
            </View>
          );
        },
      })}
    >
      <OwnerTab.Screen name="OwnerDashboard" component={SafeOwnerDashboard} options={{ tabBarLabel: 'Dashboard' }} />
      <OwnerTab.Screen name="OwnerGyms" component={SafeRegisterGym} options={{ tabBarLabel: 'Add Gym' }} />
      <OwnerTab.Screen name="OwnerCheckins" component={SafeOwnerCheckins} options={{ tabBarLabel: 'Check-ins' }} />
      <OwnerTab.Screen name="OwnerProfile" component={SafeOwnerProfile} options={{ tabBarLabel: 'Profile' }} />
    </OwnerTab.Navigator>
  );
}

// ═══════════════════════════════════════════════════
// ROOT NAVIGATOR
// ═══════════════════════════════════════════════════
interface AppNavigatorProps {
  isAuthenticated: boolean;
  userRole: 'user' | 'gym_owner' | null;
}

export default function AppNavigator({ isAuthenticated, userRole }: AppNavigatorProps) {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: COLORS.accent,
          background: COLORS.bg,
          card: COLORS.bgCard,
          text: COLORS.textPrimary,
          border: COLORS.border,
          notification: COLORS.orange,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' as const },
          medium: { fontFamily: 'System', fontWeight: '500' as const },
          bold: { fontFamily: 'System', fontWeight: '700' as const },
          heavy: { fontFamily: 'System', fontWeight: '800' as const },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: COLORS.bg },
        }}
      >
        {!isAuthenticated ? (
          // ─── Auth Flow ────────────────────────────
          <>
            <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userRole === 'gym_owner' ? (
          // ─── Gym Owner Flow ───────────────────────
          <>
            <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
            <Stack.Screen name="RegisterGym" component={SafeRegisterGym} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="EditGym" component={SafeOwnerGymDetail} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="GymQRCode" component={SafeGymQRCode} options={{ animation: 'slide_from_bottom' }} />
          </>
        ) : (
          // ─── User Flow ────────────────────────────
          <>
            <Stack.Screen name="MainTabs" component={UserTabs} />
            <Stack.Screen name="GymDetail" component={SafeGymDetail} options={{ animation: 'slide_from_bottom' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  // User tab bar
  tabBar: {
    backgroundColor: COLORS.bgCard,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 28,
    paddingTop: 8,
  },

  // Owner tab bar — gold accent
  ownerTabBar: {
    backgroundColor: COLORS.bgCard,
    borderTopColor: `${COLORS.premium}30`,
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 28,
    paddingTop: 8,
  },

  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  tabIconWrap: { alignItems: 'center', position: 'relative' },
  activeIndicator: {
    position: 'absolute', top: -10, width: 20, height: 2,
    borderRadius: 1, backgroundColor: COLORS.accent,
  },

  checkInTabIcon: { marginTop: -20 },
  checkInGradient: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
});
