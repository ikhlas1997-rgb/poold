import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import {
  getIncomingRequests, respondToRequest, getMyBookings, getMyOfferedRides,
} from '../services/rides';

type Tab = 'requests' | 'booked' | 'offered';

export default function MyRidesScreen() {
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [offered, setOffered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [r, b, o] = await Promise.all([
      getIncomingRequests(), getMyBookings(), getMyOfferedRides(),
    ]);
    setRequests(r.data); setBookings(b.data); setOffered(o.data);
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleRespond = async (bookingId: string, accept: boolean) => {
    await respondToRequest(bookingId, accept);
    load();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
      </View>

      <View style={styles.tabs}>
        <TabBtn label="Requests" count={requests.length} active={tab === 'requests'} onPress={() => setTab('requests')} />
        <TabBtn label="Booked" active={tab === 'booked'} onPress={() => setTab('booked')} />
        <TabBtn label="Offered" active={tab === 'offered'} onPress={() => setTab('offered')} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
      ) : (
        <>
          {tab === 'requests' && (
            <List
              data={requests}
              refreshing={refreshing}
              onRefresh={onRefresh}
              empty="No incoming requests. When riders ask to join your trips, they'll appear here."
              renderItem={(item) => <RequestCard item={item} onRespond={handleRespond} />}
            />
          )}
          {tab === 'booked' && (
            <List
              data={bookings}
              refreshing={refreshing}
              onRefresh={onRefresh}
              empty="You haven't joined any rides yet. Search for a ride to get started."
              renderItem={(item) => <BookingCard item={item} />}
            />
          )}
          {tab === 'offered' && (
            <List
              data={offered}
              refreshing={refreshing}
              onRefresh={onRefresh}
              empty="You haven't offered any rides yet. Tap 'Offer a ride' on the home screen."
              renderItem={(item) => <OfferedCard item={item} />}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function TabBtn({ label, count, active, onPress }: { label: string; count?: number; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {count ? <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View> : null}
    </TouchableOpacity>
  );
}

function List({ data, renderItem, empty, refreshing, onRefresh }: any) {
  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}><Ionicons name="document-text-outline" size={32} color={Colors.teal} /></View>
        <Text style={styles.emptyText}>{empty}</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={data}
      keyExtractor={(item: any) => item.id}
      contentContainerStyle={{ padding: 20, paddingTop: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
      renderItem={({ item }) => renderItem(item)}
    />
  );
}

function RequestCard({ item, onRespond }: { item: any; onRespond: (id: string, accept: boolean) => void }) {
  const initials = (item.rider?.full_name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('');
  const dt = new Date(item.ride?.departure_time);
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.rider?.full_name || 'Rider'}</Text>
          <Text style={styles.cardSub}>wants {item.seats_booked} seat{item.seats_booked > 1 ? 's' : ''} · AED {Number(item.contribution_amount).toFixed(0)}</Text>
        </View>
      </View>
      <Text style={styles.cardRoute}>{item.ride?.origin_label} → {item.ride?.destination_label}</Text>
      <Text style={styles.cardTime}>{dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => onRespond(item.id, false)}>
          <Text style={styles.rejectText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => onRespond(item.id, true)}>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BookingCard({ item }: { item: any }) {
  const dt = new Date(item.ride?.departure_time);
  const statusColor = item.status === 'accepted' ? Colors.green : item.status === 'rejected' ? Colors.error : Colors.warning;
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardRoute}>{item.ride?.origin_label} → {item.ride?.destination_label}</Text>
      </View>
      <Text style={styles.cardTime}>{dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
        <Text style={styles.cardSub}>· with {item.ride?.driver?.full_name || 'driver'}</Text>
      </View>
    </View>
  );
}

function OfferedCard({ item }: { item: any }) {
  const dt = new Date(item.departure_time);
  return (
    <View style={styles.card}>
      <Text style={styles.cardRoute}>{item.origin_label} → {item.destination_label}</Text>
      <Text style={styles.cardTime}>{dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
      <View style={styles.statusRow}>
        <Ionicons name="people-outline" size={15} color={Colors.textSecondary} />
        <Text style={styles.cardSub}>{item.seats_available}/{item.seats_total} seats left · AED {Number(item.contribution_per_seat).toFixed(0)}/seat</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 9, paddingHorizontal: 16 },
  tabActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.teal },
  badge: { backgroundColor: Colors.teal, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.bgPrimary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(4,214,191,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.teal },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 13, color: Colors.textSecondary },
  cardRoute: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  cardTime: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: 100, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  rejectText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  acceptBtn: { flex: 1, paddingVertical: 12, borderRadius: 100, backgroundColor: Colors.teal, alignItems: 'center' },
  acceptText: { fontSize: 14, fontWeight: '700', color: Colors.bgPrimary },
});
