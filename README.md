# 🏋️ FitPass — One Membership. Any Gym. Anywhere.

A cross-platform mobile app (iOS & Android) built with **React Native (Expo SDK 52)** and **Supabase** backend.

---

## 📱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native + Expo SDK 52 |
| **Language** | TypeScript |
| **Navigation** | React Navigation 7 (Stack + Bottom Tabs) |
| **State Management** | Zustand 5 |
| **Backend & Auth** | Supabase (PostgreSQL + Auth + Realtime) |
| **Database** | PostgreSQL with PostGIS |
| **Camera/QR** | expo-camera |
| **Maps** | react-native-maps |
| **Animations** | react-native-reanimated 3 |
| **Location** | expo-location |
| **Secure Storage** | expo-secure-store |
| **Haptics** | expo-haptics |

---

## 📂 Project Structure

```
fitpass-app/
├── App.tsx                          # Entry point
├── app.json                         # Expo config
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── babel.config.js                  # Babel + module resolver
│
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Email/OTP authentication
│   │   ├── RegisterScreen.tsx       # Sign up with city selection
│   │   ├── HomeScreen.tsx           # Dashboard, streaks, nearby gyms
│   │   ├── ExploreScreen.tsx        # Search, filter, browse all gyms
│   │   ├── CheckInScreen.tsx        # QR scanner for gym check-in
│   │   ├── PlansScreen.tsx          # Subscription plan selection
│   │   ├── ProfileScreen.tsx        # Stats, history, settings
│   │   └── GymDetailScreen.tsx      # Individual gym with live occupancy
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Stack + Tab navigation setup
│   │
│   ├── services/
│   │   ├── supabase.ts              # Supabase client config
│   │   ├── auth.ts                  # Authentication service
│   │   ├── gym.ts                   # Gym CRUD, search, geolocation
│   │   ├── checkin.ts               # QR check-in, sessions, history
│   │   └── subscription.ts          # Plans and payments
│   │
│   ├── hooks/
│   │   └── index.ts                 # useAuth, useGyms, useCheckIn, etc.
│   │
│   ├── context/
│   │   └── store.ts                 # Zustand global state
│   │
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   │
│   └── utils/
│       └── theme.ts                 # Colors, spacing, typography, shadows
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   # Complete database schema + seed data
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- A Supabase project (free at [supabase.com](https://supabase.com))

### 1. Clone & Install

```bash
cd fitpass-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   - Paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Click **Run**
3. Enable the **PostGIS** extension:
   - Go to **Database → Extensions** → Search "postgis" → Enable
4. Enable **Realtime** for the `gyms` table:
   - Go to **Database → Replication** → Toggle `gyms` table

### 3. Configure Environment

Edit `src/services/supabase.ts` and replace:
```typescript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Find these in Supabase: **Settings → API → Project URL** and **anon/public key**.

### 4. Run the App

```bash
# Start Expo dev server
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical device
# Scan the QR code with Expo Go app
```

---

## 🔑 Core Features

### For Users
- **Email + Phone OTP** authentication
- **Find nearby gyms** using GPS-based geolocation (PostGIS)
- **QR code check-in** at gym entrances
- **Live occupancy** indicators with real-time updates
- **Workout streak** tracking with weekly visualization
- **Subscription plans**: Standard (₹999/mo), Premium (₹1,999/mo), Annual (₹17,999/yr)
- **Gym ratings & reviews**
- **Workout history** with duration and calorie tracking

### For Gym Partners (Backend Ready)
- Dashboard-ready API for managing occupancy
- Revenue share tracking (70-80% to gym)
- QR code generation per gym
- Review management

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `users` | User profiles, streak data, plan info |
| `gyms` | Gym listings with PostGIS coordinates |
| `plans` | Subscription tiers and pricing |
| `subscriptions` | Active user subscriptions |
| `check_ins` | Session log with duration/calories |
| `reviews` | User reviews per gym |

### Key RPC Functions
- `get_nearby_gyms(lat, lng, radius)` — PostGIS proximity search
- `update_gym_rating(gym_id)` — Recalculate aggregate rating
- `update_user_streak(user_id)` — Compute consecutive workout days
- `get_workout_stats(user_id)` — Aggregate fitness statistics

---

## 💳 Payment Integration (Production)

The subscription flow is ready for **Razorpay** integration:

```bash
npm install react-native-razorpay
```

```typescript
// In PlansScreen.tsx, replace the mock payment with:
import RazorpayCheckout from 'react-native-razorpay';

const options = {
  description: 'FitPass Subscription',
  currency: 'INR',
  key: 'YOUR_RAZORPAY_KEY',
  amount: plan.price * 100, // in paise
  name: 'FitPass',
  prefill: { email: user.email, contact: user.phone },
};

const payment = await RazorpayCheckout.open(options);
await subscribe(planType, payment.razorpay_payment_id);
```

---

## 📦 Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 🗺️ Roadmap

- [ ] Razorpay payment gateway integration
- [ ] Google Maps integration for gym discovery
- [ ] Push notifications (workout reminders, promotions)
- [ ] Trainer booking system
- [ ] Fitness class scheduling
- [ ] Corporate wellness B2B module
- [ ] Supplement marketplace partnerships
- [ ] Apple Health / Google Fit sync
- [ ] Social features (workout buddies, challenges)

---

## 📄 License

Proprietary — FitPass © 2026
