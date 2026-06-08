import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import OtpScreen from './src/screens/OtpScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import { supabase, isProfileComplete } from './src/services/supabase';
import { Colors } from './src/utils/theme';

type Screen = 'splash' | 'login' | 'otp' | 'profile' | 'home';

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.teal} size="large" />
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);

  // Decide where a signed-in user should go
  const routeSignedIn = async () => {
    const complete = await isProfileComplete();
    setScreen(complete ? 'home' : 'profile');
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await routeSignedIn();
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) await routeSignedIn();
      else setScreen('login');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) return <Loading />;

  return (
    <>
      <StatusBar style="light" />

      {screen === 'splash' && <SplashScreen onFinish={() => setScreen('login')} />}

      {screen === 'login' && (
        <LoginScreen onCodeSent={(e) => { setEmail(e); setScreen('otp'); }} />
      )}

      {screen === 'otp' && (
        <OtpScreen
          email={email}
          onBack={() => setScreen('login')}
          onVerified={routeSignedIn}
        />
      )}

      {screen === 'profile' && (
        <ProfileSetupScreen onDone={() => setScreen('home')} />
      )}

      {screen === 'home' && (
        // Placeholder — real home screen next
        <Loading />
      )}
    </>
  );
}
