import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import OtpScreen from './src/screens/OtpScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import MainTabs from './src/navigation/MainTabs';
import OfferRideScreen from './src/screens/OfferRideScreen';
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';
import { supabase, isProfileComplete } from './src/services/supabase';
import { Colors } from './src/utils/theme';

type Screen = 'splash' | 'login' | 'otp' | 'profile' | 'home' | 'offer' | 'results' | 'detail';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.bgPrimary },
};

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
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  const routeSignedIn = async () => {
    const complete = await isProfileComplete();
    setScreen(complete ? 'home' : 'profile');
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await routeSignedIn();
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session) await routeSignedIn();
      else setScreen('login');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) return <Loading />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        {screen === 'splash' && <SplashScreen onFinish={() => setScreen('login')} />}

        {screen === 'login' && (
          <LoginScreen onCodeSent={(e) => { setEmail(e); setScreen('otp'); }} />
        )}

        {screen === 'otp' && (
          <OtpScreen email={email} onBack={() => setScreen('login')} onVerified={routeSignedIn} />
        )}

        {screen === 'profile' && (
          <ProfileSetupScreen onDone={() => setScreen('home')} />
        )}

        {screen === 'home' && (
          <MainTabs
            onSearch={(from, to) => { setSearchFrom(from); setSearchTo(to); setScreen('results'); }}
            onOfferRide={() => setScreen('offer')}
          />
        )}

        {screen === 'results' && (
          <SearchResultsScreen
            from={searchFrom}
            to={searchTo}
            onBack={() => setScreen('home')}
            onSelectRide={(ride) => { setSelectedRide(ride); setScreen('detail'); }}
          />
        )}

        {screen === 'detail' && selectedRide && (
          <RideDetailScreen
            ride={selectedRide}
            onBack={() => setScreen('results')}
            onRequested={() => {}}
          />
        )}

        {screen === 'offer' && (
          <OfferRideScreen
            onBack={() => setScreen('home')}
            onPosted={() => setScreen('home')}
          />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
