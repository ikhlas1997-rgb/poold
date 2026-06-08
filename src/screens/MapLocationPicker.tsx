import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '../utils/theme';
import { searchPlaces, getPlaceDetails, reverseGeocode, PlaceSuggestion } from '../services/places';

export type PickedLocation = { label: string; lat: number; lng: number };

const DUBAI = { latitude: 25.2048, longitude: 55.2708, latitudeDelta: 0.4, longitudeDelta: 0.4 };

export default function MapLocationPicker({
  title,
  onPick,
  onCancel,
}: {
  title: string;
  onPick: (loc: PickedLocation) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [region, setRegion] = useState(DUBAI);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [pinLabel, setPinLabel] = useState('');
  const [resolving, setResolving] = useState(false);
  const mapRef = useRef<MapView>(null);
  const debounce = useRef<any>(null);

  // Try to center on user's current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        const r = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(r);
        mapRef.current?.animateToRegion(r, 600);
      } catch { /* keep Dubai default */ }
    })();
  }, []);

  // Debounced place search
  const onChangeQuery = (text: string) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (!text.trim()) { setSuggestions([]); return; }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setSuggestions(results);
      setSearching(false);
    }, 350);
  };

  const pickSuggestion = async (s: PlaceSuggestion) => {
    setQuery(s.primary);
    setSuggestions([]);
    const details = await getPlaceDetails(s.placeId);
    if (details) {
      const r = { latitude: details.lat, longitude: details.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
      setRegion(r);
      setPin({ lat: details.lat, lng: details.lng });
      setPinLabel(details.label);
      mapRef.current?.animateToRegion(r, 600);
    }
  };

  // Tap on map to drop a pin
  const onMapPress = useCallback(async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ lat: latitude, lng: longitude });
    setResolving(true);
    const label = await reverseGeocode(latitude, longitude);
    setPinLabel(label);
    setQuery(label);
    setResolving(false);
  }, []);

  const confirm = () => {
    if (!pin) return;
    onPick({ label: pinLabel || 'Selected location', lat: pin.lat, lng: pin.lng });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header + search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a place"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={onChangeQuery}
        />
        {searching && <ActivityIndicator size="small" color={Colors.teal} />}
      </View>

      {/* Suggestions overlay */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <FlatList
            data={suggestions}
            keyExtractor={(i) => i.placeId}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => pickSuggestion(item)}>
                <Ionicons name="location-outline" size={18} color={Colors.teal} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionPrimary}>{item.primary}</Text>
                  {!!item.secondary && <Text style={styles.suggestionSecondary}>{item.secondary}</Text>}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DUBAI}
          region={region}
          onPress={onMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {pin && (
            <Marker coordinate={{ latitude: pin.lat, longitude: pin.lng }} />
          )}
        </MapView>

        {/* Hint */}
        {!pin && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>Tap the map to drop a pin, or search above</Text>
          </View>
        )}
      </View>

      {/* Confirm bar */}
      <View style={styles.footer}>
        {pin && (
          <Text style={styles.pinLabel} numberOfLines={1}>
            {resolving ? 'Locating…' : pinLabel}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.confirmBtn, !pin && styles.confirmBtnDisabled]}
          onPress={confirm}
          disabled={!pin}
          activeOpacity={0.9}
        >
          <Text style={[styles.confirmText, !pin && styles.confirmTextDisabled]}>Confirm location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20,
    backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 14 },
  suggestions: {
    position: 'absolute', top: 112, left: 20, right: 20, zIndex: 10,
    backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    maxHeight: 280, overflow: 'hidden',
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionPrimary: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  suggestionSecondary: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  mapWrap: { flex: 1, marginTop: 14, marginHorizontal: 20, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  map: { flex: 1 },
  hint: { position: 'absolute', top: 16, alignSelf: 'center', backgroundColor: Colors.overlay, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 16 },
  hintText: { fontSize: 13, color: Colors.textPrimary },
  footer: { padding: 20, gap: 12 },
  pinLabel: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  confirmBtn: { backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 17, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: Colors.bgSecondary },
  confirmText: { color: Colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  confirmTextDisabled: { color: Colors.textMuted },
});
