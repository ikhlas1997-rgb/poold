import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import {
  getIncomingRequests, respondToRequest, getMyBookings, getMyOfferedRides,
  getAcceptedRidersForMyRides, cancelRide, deleteRide, updateRide,
} from '../services/rides';
import { Swipeable } from 'react-native-gesture-handler';

type Tab = 'requests' | 'booked' | 'offered' | 'riders';

export default function MyRidesScreen({ onOpenChat, onViewRide, initialSubTab, onConsumeInitialTab }: { onOpenChat?: (conv: any) => void; onViewRide?: (ride: any) => void; initialSubTab?: string; onConsumeInitialTab?: () => void }) {
  const [tab, setTab] = useState<Tab>(
    (['requests', 'booked', 'offered', 'riders'].includes(initialSubTab || '') ? initialSubTab : 'requests') as Tab
  );

  // If asked to open a specific sub-tab (from a notification), honor it once.
  useEffect(() => {
    if (initialSubTab && ['requests', 'booked', 'offered', 'riders'].includes(initialSubTab)) {
      setTab(initialSubTab as Tab);
      onConsumeInitialTab?.();
    }
  }, [initialSubTab]);
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [offered, setOffered] = useState<any[]>([]);
  const [myRiders, setMyRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editRide, setEditRide] = useState<any>(null);

  const load = useCallback(async () => {
    const [r, b, o, ar] = await Promise.all([
      getIncomingRequests(), getMyBookings(), getMyOfferedRides(),
      getAcceptedRidersForMyRides(),
    ]);
    setRequests(r.data); setBookings(b.data); setOffered(o.data); setMyRiders(ar.data);
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleRespond = async (bookingId: string, accept: boolean) => {
    await respondToRequest(bookingId, accept);
    load();
  };

  const handleDelete = (ride: any) => {
    Alert.alert('Delete ride', 'Cancel this ride? Riders who booked will be notified it is no longer available.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await cancelRide(ride.id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        <TabBtn label="Requests" count={requests.length} active={tab === 'requests'} onPress={() => setTab('requests')} />
        <TabBtn label="Booked" active={tab === 'booked'} onPress={() => setTab('booked')} />
        <TabBtn label="Offered" active={tab === 'offered'} onPress={() => setTab('offered')} />
        <TabBtn label="My Riders" count={myRiders.length} active={tab === 'riders'} onPress={() => setTab('riders')} />
      </ScrollView>

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
              renderItem={(item) => <RequestCard item={item} onRespond={handleRespond} onOpenChat={onOpenChat} />}
            />
          )}
          {tab === 'booked' && (
            <List
              data={bookings}
              refreshing={refreshing}
              onRefresh={onRefresh}
              empty="You haven't joined any rides yet. Search for a ride to get started."
              renderItem={(item) => <BookingCard item={item} onOpenChat={onOpenChat} onView={() => onViewRide?.(item.ride)} />}
            />
          )}
          {tab === 'offered' && (
            <List
              data={offered}
              refreshing={refreshing}
              onRefresh={onRefresh}
              empty="You haven't offered any rides yet. Tap 'Offer a ride' on the home screen."
              renderItem={(item) => <OfferedCard item={item} onEdit={() => setEditRide(item)} onDelete={() => handleDelete(item)} />}
            />
          )}
          {tab === 'riders' && (
            <List
              data={myRiders}
              refreshing={refreshing}
              onRefresh={onRefresh}
              empty="No confirmed riders yet. When you accept a request, the rider appears here to chat and coordinate."
              renderItem={(item) => <RiderCard item={item} onOpenChat={onOpenChat} />}
            />
          )}
        </>
      )}

      <EditRideModal ride={editRide} onClose={() => setEditRide(null)} onSaved={() => { setEditRide(null); load(); }} />
    </SafeAreaView>
  );
}

function EditRideModal({ ride, onClose, onSaved }: { ride: any; onClose: () => void; onSaved: () => void }) {
  const [seats, setSeats] = useState(2);
  const [contribution, setContribution] = useState(0);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ride) {
      setSeats(ride.seats_total ?? 2);
      setContribution(Number(ride.contribution_per_seat ?? 0));
      setNotes(ride.notes ?? '');
      setDate(new Date(ride.departure_time));
    }
  }, [ride]);

  if (!ride) return null;

  const adjustTime = (h: number) => {
    const d = new Date(date); d.setHours(d.getHours() + h);
    if (d > new Date()) setDate(d);
  };

  const save = async () => {
    setSaving(true);
    // booked seats already taken = total - available
    const taken = (ride.seats_total ?? 0) - (ride.seats_available ?? 0);
    const newAvailable = Math.max(0, seats - taken);
    await updateRide(ride.id, {
      departure_time: date.toISOString(),
      seats_total: seats,
      seats_available: newAvailable,
      contribution_per_seat: contribution,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    onSaved();
  };

  const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeLabel = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal visible={!!ride} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit ride</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalRoute}>{ride.origin_label} → {ride.destination_label}</Text>

          <Text style={styles.modalLabel}>Departure</Text>
          <View style={styles.dtBox}>
            <Ionicons name="time-outline" size={18} color={Colors.teal} />
            <Text style={styles.dtText}>{dateLabel} · {timeLabel}</Text>
          </View>
          <View style={styles.timeAdjust}>
            <TouchableOpacity style={styles.adjBtn} onPress={() => adjustTime(-1)}><Text style={styles.adjText}>−1h</Text></TouchableOpacity>
            <TouchableOpacity style={styles.adjBtn} onPress={() => adjustTime(1)}><Text style={styles.adjText}>+1h</Text></TouchableOpacity>
            <TouchableOpacity style={styles.adjBtn} onPress={() => adjustTime(24)}><Text style={styles.adjText}>+1 day</Text></TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Seats</Text>
          <View style={styles.seatsRow}>
            {[1, 2, 3, 4].map(n => (
              <TouchableOpacity key={n} style={[styles.seatBtn, seats === n && styles.seatBtnActive]} onPress={() => setSeats(n)}>
                <Text style={[styles.seatText, seats === n && styles.seatTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>Contribution per seat</Text>
          <View style={styles.contribRow}>
            <TouchableOpacity style={styles.contribAdj} onPress={() => setContribution(Math.max(0, contribution - 0.5))}>
              <Ionicons name="remove" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.contribValue}>AED {contribution.toFixed(2)}</Text>
            <TouchableOpacity style={styles.contribAdj} onPress={() => setContribution(contribution + 0.5)}>
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Optional note for riders"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity style={styles.saveBtnFull} onPress={save} disabled={saving} activeOpacity={0.9}>
            {saving ? <ActivityIndicator color={Colors.bgPrimary} /> : <Text style={styles.saveBtnText}>Save changes</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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

function RequestCard({ item, onRespond, onOpenChat }: { item: any; onRespond: (id: string, accept: boolean) => void; onOpenChat?: (c: any) => void }) {
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

function BookingCard({ item, onOpenChat, onView }: { item: any; onOpenChat?: (c: any) => void; onView?: () => void }) {
  const dt = new Date(item.ride?.departure_time);
  const statusColor = item.status === 'accepted' ? Colors.green : (item.status === 'rejected' || item.status === 'cancelled') ? Colors.error : Colors.warning;
  const driverName = item.ride?.driver?.full_name || 'driver';
  const route = `${item.ride?.origin_label} → ${item.ride?.destination_label}`;
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onView} activeOpacity={0.7}>
        <View style={styles.cardHead}>
          <Text style={styles.cardRoute}>{route}</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>
        <Text style={styles.cardTime}>{dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
      </TouchableOpacity>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
        <Text style={styles.cardSub}>· with {driverName}</Text>
      </View>
      {item.status === 'accepted' && (
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => onOpenChat?.({ bookingId: item.id, otherName: driverName, routeLabel: route })}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-outline" size={16} color={Colors.teal} />
          <Text style={styles.chatBtnText}>Chat with driver</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function RiderCard({ item, onOpenChat }: { item: any; onOpenChat?: (c: any) => void }) {
  const dt = new Date(item.ride?.departure_time);
  const riderName = item.rider?.full_name || 'Rider';
  const initials = riderName.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
  const route = `${item.ride?.origin_label} → ${item.ride?.destination_label}`;
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{riderName}</Text>
          <Text style={styles.cardSub}>{item.seats_booked} seat{item.seats_booked > 1 ? 's' : ''} · AED {Number(item.contribution_amount).toFixed(0)}</Text>
        </View>
      </View>
      <Text style={styles.cardRoute}>{route}</Text>
      <Text style={styles.cardTime}>{dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={() => onOpenChat?.({ bookingId: item.id, otherName: riderName, routeLabel: route })}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-outline" size={16} color={Colors.teal} />
        <Text style={styles.chatBtnText}>Chat with rider</Text>
      </TouchableOpacity>
    </View>
  );
}

function OfferedCard({ item, onEdit, onDelete }: { item: any; onEdit: () => void; onDelete: () => void }) {
  const dt = new Date(item.departure_time);
  const cancelled = item.status === 'cancelled';

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity style={[styles.swipeBtn, styles.swipeEdit]} onPress={onEdit}>
        <Ionicons name="create-outline" size={22} color={Colors.bgPrimary} />
        <Text style={styles.swipeText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.swipeBtn, styles.swipeDelete]} onPress={onDelete}>
        <Ionicons name="trash-outline" size={22} color={Colors.white} />
        <Text style={[styles.swipeText, { color: Colors.white }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const card = (
    <View style={[styles.card, cancelled && { opacity: 0.5 }]}>
      <Text style={styles.cardRoute}>{item.origin_label} → {item.destination_label}</Text>
      <Text style={styles.cardTime}>{dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
      <View style={styles.statusRow}>
        <Ionicons name="people-outline" size={15} color={Colors.textSecondary} />
        <Text style={styles.cardSub}>
          {cancelled ? 'Cancelled' : `${item.seats_available}/${item.seats_total} seats left · AED ${Number(item.contribution_per_seat).toFixed(0)}/seat`}
        </Text>
      </View>
      {!cancelled && <Text style={styles.swipeHint}>← Swipe to edit or delete</Text>}
    </View>
  );

  if (cancelled) return card;
  return <Swipeable renderRightActions={renderRightActions} overshootRight={false}>{card}</Swipeable>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  tabsScroll: { flexGrow: 0, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
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
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 11, borderRadius: 100, borderWidth: 1, borderColor: Colors.teal },
  chatBtnText: { fontSize: 14, fontWeight: '600', color: Colors.teal },

  // swipe actions
  swipeActions: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 8 },
  swipeBtn: { width: 76, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 16 },
  swipeEdit: { backgroundColor: Colors.teal, marginRight: 8 },
  swipeDelete: { backgroundColor: Colors.error },
  swipeText: { fontSize: 12, fontWeight: '700', color: Colors.bgPrimary },
  swipeHint: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },

  // edit modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,7,25,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: Colors.border, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  modalRoute: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  modalLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 18, marginBottom: 10 },
  dtBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: 16 },
  dtText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  timeAdjust: { flexDirection: 'row', gap: 8, marginTop: 10 },
  adjBtn: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 18 },
  adjText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  seatsRow: { flexDirection: 'row', gap: 10 },
  seatBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  seatBtnActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  seatText: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  seatTextActive: { color: Colors.teal },
  contribRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  contribAdj: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  contribValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  notesInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 15, color: Colors.textPrimary, minHeight: 70, textAlignVertical: 'top' },
  saveBtnFull: { backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.bgPrimary },
});
