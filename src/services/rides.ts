import { supabase } from './supabase';

export type NewRide = {
  origin_label: string;
  origin_lat: number;
  origin_lng: number;
  destination_label: string;
  destination_lat: number;
  destination_lng: number;
  distance_km: number;
  departure_time: string;        // ISO string
  seats_total: number;
  suggested_contribution: number;
  contribution_per_seat: number;
  gender_preference: 'any' | 'male' | 'female';
  notes?: string;
};

/** Reads the platform config (pricing mode + fuel rate). */
export async function getPlatformConfig() {
  const { data, error } = await supabase
    .from('platform_config')
    .select('*')
    .eq('id', 1)
    .single();
  return { data, error };
}

/** Creates a new ride offered by the current user (driver). */
export async function createRide(ride: NewRide) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not signed in') };

  const { data, error } = await supabase
    .from('rides')
    .insert({
      driver_id: user.id,
      ...ride,
      seats_available: ride.seats_total,
      status: 'active',
    })
    .select()
    .single();

  return { data, error };
}

/** Lists rides offered by the current user. */
export async function getMyOfferedRides() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: new Error('Not signed in') };
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('driver_id', user.id)
    .order('departure_time', { ascending: true });
  return { data: data ?? [], error };
}

/** Searches active rides by origin/destination text (basic match for MVP). */
export async function searchRides(from: string, to: string) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, driver:profiles!rides_driver_id_fkey(full_name, rating, avatar_url)')
    .eq('status', 'active')
    .ilike('origin_label', `%${from}%`)
    .ilike('destination_label', `%${to}%`)
    .gt('seats_available', 0)
    .order('departure_time', { ascending: true });
  return { data: data ?? [], error };
}

// ── Search with proximity sorting ──
import { estimateDrivingKm } from '../utils/distance';

/** Lists all active rides with seats, newest departures first.
 *  If origin coords given, also sorts by distance from that origin. */
export async function listActiveRides(originLat?: number, originLng?: number) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, driver:profiles!rides_driver_id_fkey(full_name, rating, avatar_url)')
    .eq('status', 'active')
    .gt('seats_available', 0)
    .gte('departure_time', new Date().toISOString())
    .order('departure_time', { ascending: true });

  let rides = data ?? [];

  // Attach distance-from-search-origin and sort nearest first
  if (originLat != null && originLng != null) {
    rides = rides
      .map((r: any) => ({
        ...r,
        _proximity: estimateDrivingKm(originLat, originLng, r.origin_lat, r.origin_lng),
      }))
      .sort((a: any, b: any) => a._proximity - b._proximity);
  }

  return { data: rides, error };
}

// ── Bookings ──

/** Rider requests to join a ride. Creates a 'requested' booking. */
export async function requestToJoin(rideId: string, seatsBooked: number, contributionAmount: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not signed in') };
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ride_id: rideId,
      rider_id: user.id,
      seats_booked: seatsBooked,
      contribution_amount: contributionAmount,
      payment_method: 'cash',
      status: 'requested',
    })
    .select()
    .single();
  return { data, error };
}

/** Incoming booking requests for the current driver's rides. */
export async function getIncomingRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: new Error('Not signed in') };
  const { data, error } = await supabase
    .from('bookings')
    .select('*, ride:rides!inner(*), rider:profiles!bookings_rider_id_fkey(full_name, rating, avatar_url, gender)')
    .eq('ride.driver_id', user.id)
    .eq('status', 'requested')
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}

/** Driver accepts or rejects a booking request.
 *  Accept uses an atomic RPC that also decrements seats. */
export async function respondToRequest(bookingId: string, accept: boolean) {
  if (accept) {
    const { error } = await supabase.rpc('accept_booking', { p_booking_id: bookingId });
    return { data: null, error };
  }
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'rejected' })
    .eq('id', bookingId)
    .select()
    .single();
  return { data, error };
}

/** Rider's own bookings (rides they've joined/requested). */
export async function getMyBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: new Error('Not signed in') };
  const { data, error } = await supabase
    .from('bookings')
    .select('*, ride:rides!inner(*, driver:profiles!rides_driver_id_fkey(full_name, rating))')
    .eq('rider_id', user.id)
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}
