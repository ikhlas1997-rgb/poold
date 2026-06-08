import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { listActiveRides } from '../services/rides';
import { UAE_LOCATIONS } from '../utils/locations';

type SortMode = 'nearest' | 'soonest' | 'cheapest';

export default function SearchResultsScreen({
  from, to, onBack, onSelectRide,
}: {
  from: string; to: string;
  onBack?: () => void;
  onSelectRide?: (ride: any) => void;
}) {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>('nearest');

  // Resolve the search "from" text to coordinates for proximity sorting
  const origin = useMemo(() => {
    const q = from.trim().toLowerCase();
    return UAE_LOCATIONS.find(l =>
      l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q)
    );
  }, [from]);

  useEffect(() => {
    setLoading(true);
    listActiveRides(origin?.lat, origin?.lng).then(({ data }) => {
      setRides(data);
      setLoading(false);
    });
  }, [from, to]);

  const sorted = useMemo(() => {
    const arr = [...rides];
    if (sort === 'soonest') {
      arr.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
    } else if (sort === 'cheapest') {
      arr.sort((a, b) => Number(a.contribution_per_seat) - Number(b.contribution_per_seat));
    }
    // 'nearest' already sorted by listActiveRides
    return arr;
  }, [rides, sort]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.routeChip}>
          <Text style={styles.routeChipText} numberOfLines={1}>
            {from || 'Anywhere'} → {to || 'Anywhere'}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Sort tabs */}
      <View style={styles.sortRow}>
        <SortTab label="Nearest" active={sort === 'nearest'} onPress={() => setSort('nearest')} />
        <SortTab label="Soonest" active={sort === 'soonest'} onPress={() => setSort('soonest')} />
        <SortTab label="Lowest cost" active={sort === 'cheapest'} onPress={() => setSort('cheapest')} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
      ) : sorted.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}><Ionicons name="car-outline" size={36} color={Colors.teal} /></View>
          <Text style={styles.emptyTitle}>No rides yet</Text>
          <Text style={styles.emptyText}>No active rides match right now. Check back soon or be the first to offer this route.</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          renderItem={({ item }) => <RideCard ride={item} onPress={() => onSelectRide?.(item)} />}
        />
      )}
    </SafeAreaView>
  );
}

function SortTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.sortTab, active && styles.sortTabActive]} onPress={onPress}>
      <Text style={[styles.sortTabText, active && styles.sortTabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RideCard({ ride, onPress }: { ride: any; onPress: () => void }) {
  const dt = new Date(ride.departure_time);
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const day = dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const initials = (ride.driver?.full_name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Top: time + price */}
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardTime}>{time}</Text>
          <Text style={styles.cardDay}>{day}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>AED {Number(ride.contribution_per_seat).toFixed(0)}</Text>
          <Text style={styles.priceSub}>per seat</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.cardRoute}>
        <View style={styles.routeLine}>
          <View style={styles.dotFrom} />
          <View style={styles.lineConnector} />
          <View style={styles.dotTo} />
        </View>
        <View style={styles.routeLabels}>
          <Text style={styles.routeLabel} numberOfLines={1}>{ride.origin_label}</Text>
          <Text style={styles.routeLabel} numberOfLines={1}>{ride.destination_label}</Text>
        </View>
      </View>

      {/* Bottom: driver + seats */}
      <View style={styles.cardBottom}>
        <View style={styles.driverRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View>
            <Text style={styles.driverName}>{ride.driver?.full_name || 'Driver'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={Colors.green} />
              <Text style={styles.ratingText}>{Number(ride.driver?.rating ?? 5).toFixed(1)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.seatsBadge}>
          <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.seatsText}>{ride.seats_available} left</Text>
        </View>
      </View>

      {ride.gender_preference !== 'any' && (
        <View style={styles.prefBadge}>
          <Text style={styles.prefText}>
            {ride.gender_preference === 'female' ? '♀ Women only' : '♂ Men only'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  routeChip: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 100, borderWidth: 1, borderColor: Colors.border, paddingVertical: 10, paddingHorizontal: 18 },
  routeChipText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600', textAlign: 'center' },

  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  sortTab: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 16 },
  sortTabActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  sortTabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  sortTabTextActive: { color: Colors.teal, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(4,214,191,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  card: { backgroundColor: Colors.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTime: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  cardDay: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  priceTag: { alignItems: 'flex-end' },
  priceText: { fontSize: 20, fontWeight: '800', color: Colors.teal },
  priceSub: { fontSize: 11, color: Colors.textSecondary },

  cardRoute: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  routeLine: { alignItems: 'center', paddingTop: 4 },
  dotFrom: { width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, borderColor: Colors.teal },
  lineConnector: { width: 2, height: 24, backgroundColor: Colors.border, marginVertical: 2 },
  dotTo: { width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.green },
  routeLabels: { flex: 1, justifyContent: 'space-between' },
  routeLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', marginBottom: 18 },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.teal },
  driverName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { fontSize: 12, color: Colors.textSecondary },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bgSecondary, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12 },
  seatsText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  prefBadge: { alignSelf: 'flex-start', marginTop: 12, backgroundColor: 'rgba(4,214,191,0.1)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  prefText: { fontSize: 12, color: Colors.teal, fontWeight: '600' },
});
