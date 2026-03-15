// ─────────────────────────────────────────────────
// FitPass Type Definitions
// ─────────────────────────────────────────────────

export type UserRole = 'user' | 'gym_owner';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  city: string;
  role: UserRole;
  plan_id: string | null;
  plan_type: 'standard' | 'premium' | 'annual' | null;
  streak_days: number;
  total_workouts: number;
  member_since: string;
  created_at: string;
}

export interface Gym {
  id: string;
  owner_id: string | null;
  name: string;
  area: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  gym_type: 'standard' | 'premium';
  price_per_visit: number;
  amenities: string[];
  hours: string;
  image_url: string | null;
  occupancy_percent: number;
  is_active: boolean;
  phone: string | null;
  email: string | null;
  description: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  gym_id: string;
  gym?: Gym;
  checked_in_at: string;
  checked_out_at: string | null;
  duration_minutes: number | null;
  calories_burned: number | null;
  workout_type: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'standard' | 'premium' | 'annual';
  price: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
}

export interface Review {
  id: string;
  user_id: string;
  gym_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: Pick<User, 'full_name' | 'avatar_url'>;
}

export interface Plan {
  id: string;
  name: string;
  plan_type: 'standard' | 'premium' | 'annual';
  price: number;
  period: string;
  features: string[];
  is_popular: boolean;
}

export interface WorkoutStats {
  total_workouts: number;
  total_duration_minutes: number;
  total_calories: number;
  gyms_visited: number;
  current_streak: number;
  best_streak: number;
  workouts_this_month: number;
}

export interface GymOwnerStats {
  total_checkins: number;
  checkins_today: number;
  checkins_this_month: number;
  total_revenue: number;
  revenue_this_month: number;
  avg_rating: number;
  total_reviews: number;
}

// Navigation types
export type RootStackParamList = {
  RoleSelect: undefined;
  Login: { role: UserRole };
  Register: { role: UserRole };
  MainTabs: undefined;
  OwnerTabs: undefined;
  GymDetail: { gymId: string };
  QRScanner: undefined;
  PlanDetail: { planId: string };
  Settings: undefined;
  EditProfile: undefined;
  RegisterGym: undefined;
  EditGym: { gymId: string };
  GymQRCode: { gym: any };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  CheckIn: undefined;
  Plans: undefined;
  Profile: undefined;
};

export type OwnerTabParamList = {
  OwnerDashboard: undefined;
  OwnerGyms: undefined;
  OwnerCheckins: undefined;
  OwnerProfile: undefined;
};
