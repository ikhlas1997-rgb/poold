import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { requestToJoin } from '../services/rides';
import RouteMap from './RouteMap';

export default function RideDetailScreen({
  ride, onBack, onRequested,
}: {
  ride: any;
  onBack?: () => void;
  onRequested?: () => void;
}) {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState('');

  const dt = new Date(ride.departure_time);
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const day = dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const initials = (ride.driver?.full_name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('');
  const total = (Number(ride.contribution_per_seat) * seats).toFixed(2);
  const maxSeats = Math.min(ride.seats_available, 4);

  const handleRequest = async () => {
    setLoading(true);
    setError('');
    const { error } = await requestToJoin(ride.id, seats, Number(ride.contribution_per_seat) * seats);
    setLoading(false);
    if (error) { setError(error.message || 'Could not send request.'); return; }
    setRequested(true);
    onRequested?.();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Ride details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Time */}
        <View style={styles.timeCard}>
          <Text style={styles.bigTime}>{time}</Text>
          <Text style={styles.bigDay}>{day}</Text>
        </View>

        {/* Map with route */}
        {ride.origin_lat && ride.destination_lat ? (
          <View style={{ marginTop: 8, marginBottom: 16 }}>
            <RouteMap
              originLat={Number(ride.origin_lat)}
              originLng={Number(ride.origin_lng)}
              destLat={Number(ride.destination_lat)}
              destLng={Number(ride.destination_lng)}
              height={200}
            />
          </View>
        ) : null}

        {/* Route */}
        <View style={styles.routeCard}>
          <View style={styles.routeLine}>
            <View style={styles.dotFrom} />
            <View style={styles.lineConnector} />
            <View style={styles.dotTo} />
          </View>
          <View style={styles.routeLabels}>
            <View style={{ marginBottom: 28 }}>
              <Text style={styles.routeSmall}>FROM</Text>
              <Text style={styles.routeLabel}>{ride.origin_label}</Text>
            </View>
            <View>
              <Text style={styles.routeSmall}>TO</Text>
              <Text style={styles.routeLabel}>{ride.destination_label}</Text>
            </View>
          </View>
        </View>

        {ride.distance_km > 0 && (
          <Text style={styles.distance}>≈ {ride.distance_km} km journey</Text>
        )}

        {/* Driver */}
        <View style={styles.driverCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{ride.driver?.full_name || 'Driver'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={Colors.green} />
              <Text style={styles.ratingText}>{Number(ride.driver?.rating ?? 5).toFixed(1)} · Driver</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {ride.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Note from driver</Text>
            <Text style={styles.notesText}>{ride.notes}</Text>
          </View>
        ) : null}

        {/* Seats selector */}
        <Text style={styles.label}>How many seats?</Text>
        <View style={styles.seatsRow}>
          {Array.from({ length: maxSeats }, (_, i) => i + 1).map(n => (
            <TouchableOpacity key={n} style={[styles.seatBtn, seats === n && styles.seatBtnActive]} onPress={() => setSeats(n)}>
              <Text style={[styles.seatText, seats === n && styles.seatTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cost breakdown */}
        <View style={styles.costCard}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Contribution per seat</Text>
            <Text style={styles.costValue}>AED {Number(ride.contribution_per_seat).toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Seats</Text>
            <Text style={styles.costValue}>× {seats}</Text>
          </View>
          <View style={[styles.costRow, styles.costTotal]}>
            <Text style={styles.costTotalLabel}>Your contribution</Text>
            <Text style={styles.costTotalValue}>AED {total}</Text>
          </View>
          <Text style={styles.costNote}>Cost-sharing only — paid in cash to the driver. Covers fuel, no profit.</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.footer}>
        {requested ? (
          <View style={styles.requestedBox}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
            <Text style={styles.requestedText}>Request sent! The driver will confirm soon.</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.requestBtn} onPress={handleRequest} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color={Colors.bgPrimary} />
              : <Text style={styles.requestText}>Request to join · AED {total}</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  topTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  timeCard: { alignItems: 'center', paddingVertical: 12 },
  bigTime: { fontSize: 40, fontWeight: '800', color: Colors.textPrimary },
  bigDay: { fontSize: 15, color: Colors.textSecondary, marginTop: 4 },

  routeCard: { flexDirection: 'row', gap: 14, backgroundColor: Colors.bgCard, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.border, marginTop: 12 },
  routeLine: { alignItems: 'center', paddingTop: 6 },
  dotFrom: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: Colors.teal },
  lineConnector: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  dotTo: { width: 12, height: 12, borderRadius: 3, backgroundColor: Colors.green },
  routeLabels: { flex: 1 },
  routeSmall: { fontSize: 11, color: Colors.textMuted, letterSpacing: 1, marginBottom: 3 },
  routeLabel: { fontSize: 16, color: Colors.textPrimary, fontWeight: '600' },
  distance: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },

  driverCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginTop: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.teal },
  driverName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { fontSize: 13, color: Colors.textSecondary },

  notesCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginTop: 14 },
  notesLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, letterSpacing: 0.5 },
  notesText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },

  label: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 24, marginBottom: 12 },
  seatsRow: { flexDirection: 'row', gap: 10 },
  seatBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  seatBtnActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  seatText: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  seatTextActive: { color: Colors.teal },

  costCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border, marginTop: 20 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  costLabel: { fontSize: 14, color: Colors.textSecondary },
  costValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  costTotal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginBottom: 8 },
  costTotalLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '700' },
  costTotalValue: { fontSize: 20, color: Colors.teal, fontWeight: '800' },
  costNote: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  errorText: { fontSize: 13, color: Colors.error, marginTop: 16, textAlign: 'center' },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgPrimary },
  requestBtn: { backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 17, alignItems: 'center' },
  requestText: { color: Colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  requestedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  requestedText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
});
