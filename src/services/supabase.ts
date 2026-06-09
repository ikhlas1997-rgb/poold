import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rsxpvogkyblafoxkgkxr.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeHB2b2dreWJsYWZveGtna3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjA1OTQsImV4cCI6MjA5NjMzNjU5NH0.MQOYkSKss7zaTbcyrYSGrd5YVQbDSpHXug-HqllmnZA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Email OTP helpers ──

/** Sends a 6-digit code to the user's email. */
export async function sendEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // creates account if new
    },
  });
  return { error };
}

/** Verifies the 6-digit code the user entered. */
export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  return { data, error };
}

/** Signs the current user out. */
export async function signOut() {
  return await supabase.auth.signOut();
}

// ── Password auth ──

/** Sign up a new user with email + password. */
export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  return { data, error };
}

/** Sign in an existing user with email + password. */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return { data, error };
}

/** Send a password reset email (uses OTP/recovery). */
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return { error };
}

// ── Profile helpers ──

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'rider' | 'driver' | 'both';
  gender: 'male' | 'female' | 'prefer_not_to_say' | null;
  city: string | null;
  country: string;
  is_verified: boolean;
  rating: number;
  total_rides: number;
};

/** Gets the current user's profile. */
export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not signed in') };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return { data: data as Profile | null, error };
}

/** Updates the current user's profile. Uses upsert so it works
 *  even if the profile row doesn't exist yet. */
export async function updateMyProfile(updates: Partial<Profile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not signed in') };
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates }, { onConflict: 'id' })
    .select()
    .single();
  return { data: data as Profile | null, error };
}

/** Checks if the user has completed their profile (has a name + role). */
export async function isProfileComplete() {
  const { data } = await getMyProfile();
  return !!(data && data.full_name && data.full_name.trim().length > 0);
}

/** Returns the signed-in user's email (from auth). */
export async function getMyEmail(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ?? null;
}
