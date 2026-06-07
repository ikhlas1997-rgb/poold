import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import OtpScreen from './src/screens/OtpScreen';
import { supabase } from './src/services/supabase';
import { Colors } from './src/utils/theme';

type Screen = 'splash' | 'login' | 'otp' | 'home';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);

  // Check if already signed in on launch
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setScreen('home');
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setScreen('home');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.teal} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />

      {screen === 'splash' && (
        <SplashScreen onFinish={() => setScreen('login')} />
      )}

      {screen === 'login' && (
        <LoginScreen
          onCodeSent={(e) => { setEmail(e); setScreen('otp'); }}
        />
      )}

      {screen === 'otp' && (
        <OtpScreen
          email={email}
          onBack={() => setScreen('login')}
          onVerified={() => setScreen('home')}
        />
      )}

      {screen === 'home' && (
        // Placeholder — we build the real home screen next
        <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.teal} />
        </View>
      )}
    </>
  );
}
