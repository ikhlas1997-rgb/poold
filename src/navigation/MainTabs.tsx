import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../utils/theme';

import HomeScreen from '../screens/HomeScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import MyRidesScreen from '../screens/MyRidesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessagesScreen from '../screens/MessagesScreen';

const Tab = createBottomTabNavigator();

// Wrap placeholders so each tab has its own content

export default function MainTabs({
  onSearch,
  onOfferRide,
  onOpenChat,
  onOpenNotifications,
  onViewRide,
  initialTab,
  onConsumeInitialTab,
  unreadCount = 0,
  messageCount = 0,
}: {
  onSearch?: (from: string, to: string) => void;
  onOfferRide?: () => void;
  onOpenChat?: (conv: any) => void;
  onOpenNotifications?: () => void;
  onViewRide?: (ride: any) => void;
  initialTab?: string;
  onConsumeInitialTab?: () => void;
  unreadCount?: number;
  messageCount?: number;
}) {
  // When a notification asks us to open a specific My Rides sub-tab, also make
  // the bottom navigator start on "My Rides" by remounting with a new key.
  const startRoute = initialTab ? 'My Rides' : 'Home';
  const navKey = initialTab ? `nav-${initialTab}-${Date.now()}` : 'nav-default';

  return (
    <Tab.Navigator
      key={navKey}
      initialRouteName={startRoute}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            'My Rides': focused ? 'list' : 'list-outline',
            Messages: focused ? 'chatbubble' : 'chatbubble-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreen onSearch={onSearch} onOfferRide={onOfferRide} onOpenNotifications={onOpenNotifications} unreadCount={unreadCount} />}
      </Tab.Screen>
      <Tab.Screen name="My Rides">
        {() => <MyRidesScreen onOpenChat={onOpenChat} onViewRide={onViewRide} initialSubTab={initialTab} onConsumeInitialTab={onConsumeInitialTab} />}
      </Tab.Screen>
      <Tab.Screen
        name="Messages"
        options={{
          tabBarBadge: messageCount > 0 ? (messageCount > 9 ? '9+' : messageCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.error, color: Colors.white, fontSize: 10, fontWeight: '700' },
        }}
      >
        {() => <MessagesScreen onOpenChat={onOpenChat} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
