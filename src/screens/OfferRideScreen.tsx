import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, FlatList, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { estimateDrivingKm, suggestedContribution } from '../utils/distance';
import { createRide, getPlatformConfig } from '../services/rides';
import MapLocationPicker, { PickedLocation } from './MapLocationPicker';

type Gender = 'any' | 'male' | 'female';

export default function OfferRideScreen({ onBack, onPosted }: { onBack?: () => void; onPosted?: () => void }) {
  const [origin, setOrigin] = useState<PickedLocation | null>(null);
  const [destination, setDestination] = useState<PickedLocation | null>(null);
  const [seats, setSeats] = useState(2);
  const [genderPref, setGenderPref] = useState<Gender>('any');
  const [notes, setNotes] = useState('');
  const [contribution, setContribution] = useState(0);
  const [fuelRate, setFuelRate] = useState(0.42);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  // Date/time — default to 1 hour from now
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });

  // Location picker modal
  const [picker, setPicker] = useState<null | 'origin' | 'destination'>(null);

  useEffect(() => {
    getPlatformConfig().then(({ data }) => {
      if (data?.fuel_rate_aed) setFuelRate(Number(data.fuel_rate_aed));
    });
  }, []);

  // Distance + suggested contribution
  const distanceKm = useMemo(() => {
    if (!origin || !destination) return 0;
    return Math.round(estimateDrivingKm(origin.lat, origin.lng, destination.lat, destination.lng) * 10) / 10;
  }, [origin, destination]);

  const suggested = useMemo(
    () => suggestedContribution(distanceKm, fuelRate, seats),
    [distanceKm, fuelRate, seats]
  );

  // Reset contribution to suggested when inputs change
  useEffect(() => { setContribution(suggested); }, [suggested]);

  const canPost = origin && destination && origin.label !== destination.label && contribution >= 0;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    setError('');
    const { error } = await createRide({
      origin_label: origin!.label,
      origin_lat: origin!.lat,
      origin_lng: origin!.lng,
      destination_label: destination!.label,
      destination_lat: destination!.lat,
      destination_lng: destination!.lng,
      distance_km: distanceKm,
      departure_time: date.toISOString(),
      seats_total: seats,
      suggested_contribution: suggested,
      contribution_per_seat: contribution,
      gender_preference: genderPref,
      notes: notes.trim() || undefined,
    });
    setPosting(false);
    if (error) { setError(error.message || 'Could not post ride.'); return; }
    onPosted?.();
  };

  const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeLabel = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const adjustTime = (hours: number) => {
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    if (d > new Date()) setDate(d);
  };

  if (picker) {
    return (
      <MapLocationPicker
        title={picker === 'origin' ? 'Pick-up location' : 'Drop-off location'}
        onCancel={() => setPicker(null)}
        onPick={(loc) => {
          if (picker === 'origin') setOrigin(loc); else setDestination(loc);
          setPicker(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Offer a ride</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Route */}
        <Text style={styles.label}>Route</Text>
        <View style={styles.routeCard}>
          <TouchableOpacity style={styles.routeRow} onPress={() => setPicker('origin')}>
            <View style={styles.dotFrom} />
            <Text style={[styles.routeText, !origin && styles.placeholder]}>
              {origin ? origin.label : 'Pick-up location'}
            </Text>
          </TouchableOpacity>
          <View style={styles.routeDivider} />
          <TouchableOpacity style={styles.routeRow} onPress={() => setPicker('destination')}>
            <View style={styles.dotTo} />
            <Text style={[styles.routeText, !destination && styles.placeholder]}>
              {destination ? destination.label : 'Drop-off location'}
            </Text>
          </TouchableOpacity>
        </View>

        {distanceKm > 0 && (
          <Text style={styles.distanceNote}>Estimated distance: {distanceKm} km</Text>
        )}

        {/* Date & time */}
        <Text style={styles.label}>Departure</Text>
        <View style={styles.dtRow}>
          <View style={styles.dtBox}>
            <Ionicons name="calendar-outline" size={18} color={Colors.teal} />
            <Text style={styles.dtText}>{dateLabel}</Text>
          </View>
          <View style={styles.dtBox}>
            <Ionicons name="time-outline" size={18} color={Colors.teal} />
            <Text style={styles.dtText}>{timeLabel}</Text>
          </View>
        </View>
        <View style={styles.timeAdjust}>
          <TouchableOpacity style={styles.adjBtn} onPress={() => adjustTime(-1)}><Text style={styles.adjText}>−1h</Text></TouchableOpacity>
          <TouchableOpacity style={styles.adjBtn} onPress={() => adjustTime(1)}><Text style={styles.adjText}>+1h</Text></TouchableOpacity>
          <TouchableOpacity style={styles.adjBtn} onPress={() => adjustTime(24)}><Text style={styles.adjText}>+1 day</Text></TouchableOpacity>
        </View>
        <Text style={styles.hint}>Quick adjust for now — full date picker comes with the calendar component.</Text>

        {/* Seats */}
        <Text style={styles.label}>Seats available</Text>
        <View style={styles.seatsRow}>
          {[1, 2, 3, 4].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.seatBtn, seats === n && styles.seatBtnActive]}
              onPress={() => setSeats(n)}
            >
              <Text style={[styles.seatText, seats === n && styles.seatTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contribution — the compliant cost-share */}
        <Text style={styles.label}>Cost contribution per seat</Text>
        <View style={styles.contribCard}>
          <View style={styles.contribTop}>
            <TouchableOpacity style={styles.contribAdj} onPress={() => setContribution(Math.max(0, contribution - 0.5))}>
              <Ionicons name="remove" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.contribValueWrap}>
              <Text style={styles.contribValue}>AED {contribution.toFixed(2)}</Text>
              <Text style={styles.contribPer}>per seat</Text>
            </View>
            <TouchableOpacity style={styles.contribAdj} onPress={() => setContribution(contribution + 0.5)}>
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          {suggested > 0 && (
            <View style={styles.suggestedRow}>
              <Ionicons name="information-circle-outline" size={15} color={Colors.teal} />
              <Text style={styles.suggestedText}>
                Suggested fair split: AED {suggested.toFixed(2)} — covers fuel only, no profit (UAE cost-sharing compliant)
              </Text>
            </View>
          )}
        </View>

        {/* Gender preference */}
        <Text style={styles.label}>Rider preference <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.genderRow}>
          {(['any', 'male', 'female'] as Gender[]).map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.genderPill, genderPref === g && styles.genderPillActive]}
              onPress={() => setGenderPref(g)}
            >
              <Text style={[styles.genderText, genderPref === g && styles.genderTextActive]}>
                {g === 'any' ? 'Anyone' : g === 'male' ? 'Men only' : 'Women only'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g. Meeting point near the metro exit, no smoking, etc."
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost || posting}
          activeOpacity={0.9}
        >
          {posting ? <ActivityIndicator color={Colors.bgPrimary} />
            : <Text style={[styles.postText, !canPost && styles.postTextDisabled]}>Publish ride</Text>}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  topTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  label: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 22, marginBottom: 10 },
  optional: { fontSize: 13, fontWeight: '400', color: Colors.textMuted },

  routeCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  dotFrom: { width: 11, height: 11, borderRadius: 6, borderWidth: 2.5, borderColor: Colors.teal },
  dotTo: { width: 11, height: 11, borderRadius: 2, backgroundColor: Colors.green },
  routeText: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  placeholder: { color: Colors.textMuted },
  routeDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 23, marginVertical: 4 },
  distanceNote: { fontSize: 13, color: Colors.teal, marginTop: 10, fontWeight: '600' },

  dtRow: { flexDirection: 'row', gap: 12 },
  dtBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 15, paddingHorizontal: 16 },
  dtText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  timeAdjust: { flexDirection: 'row', gap: 8, marginTop: 10 },
  adjBtn: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 18 },
  adjText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },

  seatsRow: { flexDirection: 'row', gap: 10 },
  seatBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  seatBtnActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  seatText: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  seatTextActive: { color: Colors.teal },

  contribCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border },
  contribTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contribAdj: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  contribValueWrap: { alignItems: 'center' },
  contribValue: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  contribPer: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  suggestedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  suggestedText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  genderRow: { flexDirection: 'row', gap: 8 },
  genderPill: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 12, alignItems: 'center' },
  genderPillActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  genderText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  genderTextActive: { color: Colors.teal, fontWeight: '600' },

  notesInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, fontSize: 15, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top' },

  errorText: { fontSize: 13, color: Colors.error, marginTop: 16, textAlign: 'center' },

  postBtn: { backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 17, alignItems: 'center', marginTop: 24 },
  postBtnDisabled: { backgroundColor: Colors.bgSecondary },
  postText: { color: Colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  postTextDisabled: { color: Colors.textMuted },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingHorizontal: 20, height: '75%', borderWidth: 1, borderColor: Colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 14 },
  locItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  locName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  locArea: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
