import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../utils/theme';

import HomeScreen from '../screens/HomeScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import MyRidesScreen from '../screens/MyRidesScreen';

const Tab = createBottomTabNavigator();

// Wrap placeholders so each tab has its own content
function MessagesScreen() {
  return <PlaceholderScreen title="Messages" icon="chatbubble-outline"
    message="Chat with drivers and riders here. Coming in the next build." />;
}
function ProfileTabScreen() {
  return <PlaceholderScreen title="Profile" icon="person-outline"
    message="Your profile, ratings, and settings. Coming soon." />;
}

export default function MainTabs({
  onSearch,
  onOfferRide,
}: {
  onSearch?: (from: string, to: string) => void;
  onOfferRide?: () => void;
}) {
  return (
    <Tab.Navigator
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
        {() => <HomeScreen onSearch={onSearch} onOfferRide={onOfferRide} />}
      </Tab.Screen>
      <Tab.Screen name="My Rides" component={MyRidesScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileTabScreen} />
    </Tab.Navigator>
  );
}
