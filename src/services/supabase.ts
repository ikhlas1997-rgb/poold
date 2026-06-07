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
