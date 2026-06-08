// Free distance estimation — no API key needed.
// Haversine (straight-line) × road factor ≈ real driving distance.
// Swap for Google Routes API later without changing callers.

const ROAD_FACTOR = 1.3; // roads aren't straight; ~30% longer than crow-flies

export function haversineKm(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371; // earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Estimated driving distance in km between two points. */
export function estimateDrivingKm(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  return haversineKm(lat1, lng1, lat2, lng2) * ROAD_FACTOR;
}

/** Fair cost-share contribution per seat (compliant — covers fuel, no profit).
 *  distanceKm × fuelRate (AED/km) ÷ shared occupants (driver + riders). */
export function suggestedContribution(
  distanceKm: number,
  fuelRateAed: number,
  totalSeats: number
): number {
  if (distanceKm <= 0 || totalSeats <= 0) return 0;
  const totalFuelCost = distanceKm * fuelRateAed;
  // Split across everyone in the car (driver + the seats). Driver pays a share too.
  const occupants = totalSeats + 1;
  const perPerson = totalFuelCost / occupants;
  // Round to nearest 0.5 AED for clean amounts
  return Math.round(perPerson * 2) / 2;
}
