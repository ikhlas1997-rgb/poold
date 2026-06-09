import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { getMyProfile, Profile } from '../services/supabase';

const POPULAR_ROUTES = [
  { from: 'Sharjah', to: 'Dubai', riders: 142 },
  { from: 'Abu Dhabi', to: 'Dubai', riders: 89 },
  { from: 'Dubai Marina', to: 'DIFC', riders: 67 },
  { from: 'Al Ain', to: 'Abu Dhabi', riders: 34 },
];

export default function HomeScreen({
  onSearch,
  onOfferRide,
  onOpenNotifications,
  unreadCount = 0,
}: {
  onSearch?: (from: string, to: string) => void;
  onOfferRide?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    getMyProfile().then(({ data }) => setProfile(data));
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const canSearch = from.trim() && to.trim();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Where are you heading today?</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={onOpenNotifications} hitSlop={10} style={styles.bell}>
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Image source={require('../../assets/logo/icon.png')} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        {/* SEARCH CARD */}
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <View style={styles.dotFrom} />
            <TextInput
              style={styles.searchInput}
              placeholder="From where?"
              placeholderTextColor={Colors.textMuted}
              value={from}
              onChangeText={setFrom}
            />
          </View>
          <View style={styles.searchDivider} />
          <View style={styles.searchRow}>
            <View style={styles.dotTo} />
            <TextInput
              style={styles.searchInput}
              placeholder="Where to?"
              placeholderTextColor={Colors.textMuted}
              value={to}
              onChangeText={setTo}
            />
          </View>

          <TouchableOpacity
            style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
            onPress={() => canSearch && onSearch?.(from.trim(), to.trim())}
            disabled={!canSearch}
            activeOpacity={0.9}
          >
            <Ionicons name="search" size={18} color={Colors.bgPrimary} />
            <Text style={styles.searchBtnText}>Find rides</Text>
          </TouchableOpacity>
        </View>

        {/* OFFER A RIDE — secondary action */}
        <TouchableOpacity style={styles.offerCard} onPress={onOfferRide} activeOpacity={0.85}>
          <View style={styles.offerIcon}>
            <Ionicons name="car-outline" size={22} color={Colors.teal} />
          </View>
          <View style={styles.offerTextWrap}>
            <Text style={styles.offerTitle}>Driving somewhere?</Text>
            <Text style={styles.offerSub}>Offer a ride and share your costs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* POPULAR ROUTES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular routes</Text>
          <Text style={styles.sectionLink}>See all</Text>
        </View>

        {POPULAR_ROUTES.map((route, i) => (
          <TouchableOpacity
            key={i}
            style={styles.routeCard}
            onPress={() => onSearch?.(route.from, route.to)}
            activeOpacity={0.85}
          >
            <View style={styles.routeIcon}>
              <Ionicons name="navigate" size={18} color={Colors.teal} />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>{route.from} → {route.to}</Text>
              <Text style={styles.routeSub}>{route.riders} riders this week</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* IMPACT STRIP */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Your impact with PoolD</Text>
          <View style={styles.impactRow}>
            <Impact value={`${profile?.total_rides ?? 0}`} label="Rides shared" />
            <View style={styles.impactDivider} />
            <Impact value="AED 0" label="Saved" />
            <View style={styles.impactDivider} />
            <Impact value="0 kg" label="CO₂ saved" />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Impact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.impactItem}>
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subGreeting: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  logo: { width: 44, height: 44 },
  bell: { position: 'relative' },
  bellBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.error, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: Colors.bgPrimary },
  bellBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },

  searchCard: {
    backgroundColor: Colors.bgCard, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  dotFrom: { width: 11, height: 11, borderRadius: 6, borderWidth: 2.5, borderColor: Colors.teal },
  dotTo: { width: 11, height: 11, borderRadius: 2, backgroundColor: Colors.green },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: 8 },
  searchDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 23, marginVertical: 4 },
  searchBtn: {
    backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14,
  },
  searchBtnDisabled: { backgroundColor: Colors.bgSecondary },
  searchBtnText: { color: Colors.bgPrimary, fontSize: 16, fontWeight: '700' },

  offerCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28,
  },
  offerIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(4,214,191,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  offerTextWrap: { flex: 1 },
  offerTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  offerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionLink: { fontSize: 14, color: Colors.teal, fontWeight: '600' },

  routeCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
  },
  routeIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(4,214,191,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  routeInfo: { flex: 1 },
  routeText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  routeSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  impactCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.border, marginTop: 18,
  },
  impactTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  impactRow: { flexDirection: 'row', alignItems: 'center' },
  impactItem: { flex: 1, alignItems: 'center' },
  impactValue: { fontSize: 20, fontWeight: '800', color: Colors.teal },
  impactLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  impactDivider: { width: 1, height: 36, backgroundColor: Colors.border },
});
