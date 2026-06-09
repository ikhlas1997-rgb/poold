import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import MainTabs from './src/navigation/MainTabs';
import OfferRideScreen from './src/screens/OfferRideScreen';
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { getUnreadCount, getUnreadCountByType, subscribeToNotifications, markMessagesReadForBooking } from './src/services/notifications';
import { getRideById, getBookingById } from './src/services/rides';
import { supabase, isProfileComplete } from './src/services/supabase';
import { Colors } from './src/utils/theme';

type Screen = 'splash' | 'login' | 'profile' | 'home' | 'offer' | 'results' | 'detail' | 'chat' | 'notifications';

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
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [cameFrom, setCameFrom] = useState<Screen>('results');
  const [ridesInitialTab, setRidesInitialTab] = useState<string | undefined>(undefined);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
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

  // Track unread notification count + subscribe to new ones in realtime
  const refreshUnread = async () => {
    setUnread(await getUnreadCount());
    setMsgUnread(await getUnreadCountByType('message'));
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      await refreshUnread();
      unsub = subscribeToNotifications(uid, () => refreshUnread());
    })();
    return () => { unsub?.(); };
  }, [screen === 'home']);

  // Route a tapped notification to the right screen.
  const handleNotificationNavigate = async (n: any) => {
    const bookingId = n.data?.booking_id;
    const rideId = n.data?.ride_id;

    if (n.type === 'message' && bookingId) {
      const { data } = await getBookingById(bookingId);
      if (data) {
        const { data: { user } } = await supabase.auth.getUser();
        const iAmDriver = data.ride?.driver_id === user?.id;
        const otherName = iAmDriver ? (data.rider?.full_name || 'Rider') : (data.ride?.driver?.full_name || 'Driver');
        const route = `${data.ride?.origin_label} → ${data.ride?.destination_label}`;
        setActiveChat({ bookingId, otherName, routeLabel: route });
        setScreen('chat');
        await markMessagesReadForBooking(bookingId);
        refreshUnread();
      }
      return;
    }

    if (n.type === 'request') {
      // Driver: jump to My Rides on the Requests tab
      setRidesInitialTab('requests');
      setScreen('home');
      return;
    }

    // accepted / updated / cancelled / rejected -> open the ride detail
    if (rideId) {
      const { data } = await getRideById(rideId);
      if (data) {
        setSelectedRide(data);
        setCameFrom('notifications');
        setScreen('detail');
      }
    }
  };

  if (checking) return <Loading />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        {screen === 'splash' && <SplashScreen onFinish={() => setScreen('login')} />}

        {screen === 'login' && (
          <AuthScreen onAuthed={routeSignedIn} />
        )}

        {screen === 'profile' && (
          <ProfileSetupScreen onDone={() => setScreen('home')} />
        )}

        {screen === 'home' && (
          <MainTabs
            onSearch={(from, to) => { setSearchFrom(from); setSearchTo(to); setScreen('results'); }}
            onOfferRide={() => setScreen('offer')}
            onOpenChat={async (conv) => {
              setActiveChat(conv); setScreen('chat');
              await markMessagesReadForBooking(conv.bookingId);
              refreshUnread();
            }}
            onOpenNotifications={() => setScreen('notifications')}
            onViewRide={(ride) => { setSelectedRide(ride); setCameFrom('home'); setScreen('detail'); }}
            initialTab={ridesInitialTab}
            onConsumeInitialTab={() => setRidesInitialTab(undefined)}
            unreadCount={unread}
            messageCount={msgUnread}
          />
        )}

        {screen === 'results' && (
          <SearchResultsScreen
            from={searchFrom}
            to={searchTo}
            onBack={() => setScreen('home')}
            onSelectRide={(ride) => { setSelectedRide(ride); setCameFrom('results'); setScreen('detail'); }}
          />
        )}

        {screen === 'detail' && selectedRide && (
          <RideDetailScreen
            ride={selectedRide}
            onBack={() => setScreen(cameFrom)}
            onRequested={() => {}}
          />
        )}

        {screen === 'chat' && activeChat && (
          <ChatScreen
            bookingId={activeChat.bookingId}
            otherName={activeChat.otherName}
            routeLabel={activeChat.routeLabel}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'notifications' && (
          <NotificationsScreen
            onBack={() => { setScreen('home'); refreshUnread(); }}
            onRefreshBadge={refreshUnread}
            onNavigate={handleNotificationNavigate}
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
    </GestureHandlerRootView>
  );
}
