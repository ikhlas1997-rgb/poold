import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../utils/theme';
import { getRoute } from '../services/places';

export default function RouteMap({
  originLat, originLng, destLat, destLng, height = 200,
}: {
  originLat: number; originLng: number; destLat: number; destLng: number; height?: number;
}) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let active = true;
    getRoute(originLat, originLng, destLat, destLng).then((r) => {
      if (!active) return;
      if (r?.coords?.length) {
        setCoords(r.coords);
      } else {
        // fallback: straight line between the two points
        setCoords([
          { latitude: originLat, longitude: originLng },
          { latitude: destLat, longitude: destLng },
        ]);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [originLat, originLng, destLat, destLng]);

  // Fit the map to show both points once coords are ready
  useEffect(() => {
    if (coords.length && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [{ latitude: originLat, longitude: originLng }, { latitude: destLat, longitude: destLng }],
          { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }
        );
      }, 300);
    }
  }, [coords]);

  const midLat = (originLat + destLat) / 2;
  const midLng = (originLng + destLng) / 2;

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: midLat, longitude: midLng,
          latitudeDelta: Math.abs(originLat - destLat) * 2 + 0.05,
          longitudeDelta: Math.abs(originLng - destLng) * 2 + 0.05,
        }}
        pointerEvents="none"
      >
        <Marker coordinate={{ latitude: originLat, longitude: originLng }}>
          <View style={styles.originPin} />
        </Marker>
        <Marker coordinate={{ latitude: destLat, longitude: destLng }}>
          <View style={styles.destPin} />
        </Marker>
        {coords.length > 0 && (
          <Polyline coordinates={coords} strokeColor={Colors.teal} strokeWidth={4} />
        )}
      </MapView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.teal} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgCard },
  originPin: { width: 16, height: 16, borderRadius: 8, borderWidth: 4, borderColor: Colors.teal, backgroundColor: Colors.bgPrimary },
  destPin: { width: 16, height: 16, borderRadius: 3, backgroundColor: Colors.green, borderWidth: 2, borderColor: Colors.bgPrimary },
});
