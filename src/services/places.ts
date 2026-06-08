// Google Places (New) autocomplete + geocoding for the UAE.
// Uses the key from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.

import Constants from 'expo-constants';

// Read the Maps key from app.json -> expo.extra.googleMapsApiKey
// (single source of truth; same key used for the native map).
const KEY: string | undefined =
  (Constants.expoConfig?.extra as any)?.googleMapsApiKey ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

console.log('[PoolD] Maps key loaded?', KEY ? `yes (${KEY.slice(0,6)}...${KEY.slice(-4)})` : 'NO — missing');

export type PlaceSuggestion = {
  placeId: string;
  primary: string;     // e.g. "Dubai Marina Mall"
  secondary: string;   // e.g. "Dubai - United Arab Emirates"
};

export type ResolvedPlace = {
  label: string;
  lat: number;
  lng: number;
};

/** Autocomplete search, biased to the UAE. */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!KEY) { console.warn('Places: API key is missing (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)'); return []; }
  if (!query.trim()) return [];
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': KEY,
      },
      body: JSON.stringify({
        input: query,
        // Bias toward UAE
        locationBias: {
          rectangle: {
            low: { latitude: 22.5, longitude: 51.0 },
            high: { latitude: 26.5, longitude: 56.5 },
          },
        },
        includedRegionCodes: ['ae'],
      }),
    });
    const data = await res.json();
    if (data.error) {
      console.warn('Places API error:', JSON.stringify(data.error));
    }
    const suggestions = data.suggestions ?? [];
    if (suggestions.length === 0) {
      console.log('Places: no suggestions for', query, '| raw:', JSON.stringify(data).slice(0, 300));
    }
    return suggestions
      .filter((s: any) => s.placePrediction)
      .map((s: any) => ({
        placeId: s.placePrediction.placeId,
        primary: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? '',
        secondary: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
      }));
  } catch (e) {
    console.warn('Places search failed', e);
    return [];
  }
}

/** Resolve a placeId to coordinates + label. */
export async function getPlaceDetails(placeId: string): Promise<ResolvedPlace | null> {
  if (!KEY) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': 'displayName,formattedAddress,location',
      },
    });
    const data = await res.json();
    if (!data.location) return null;
    return {
      label: data.displayName?.text || data.formattedAddress || 'Selected location',
      lat: data.location.latitude,
      lng: data.location.longitude,
    };
  } catch (e) {
    console.warn('Place details failed', e);
    return null;
  }
}

/** Reverse geocode coordinates (from a dropped pin) to a readable label. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!KEY) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${KEY}`
    );
    const data = await res.json();
    return data.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
