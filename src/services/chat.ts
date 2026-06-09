import { supabase } from './supabase';

export type Message = {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/** Loads all messages for a booking, oldest first. */
export async function getMessages(bookingId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });
  return { data: (data ?? []) as Message[], error };
}

/** Sends a message in a booking conversation. */
export async function sendMessage(bookingId: string, body: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not signed in') };
  const { data, error } = await supabase
    .from('messages')
    .insert({ booking_id: bookingId, sender_id: user.id, body: body.trim() })
    .select()
    .single();
  return { data: data as Message | null, error };
}

/** Subscribes to new messages on a booking in realtime.
 *  Returns an unsubscribe function. */
export function subscribeToMessages(bookingId: string, onNew: (m: Message) => void) {
  const channel = supabase
    .channel(`messages:${bookingId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
      (payload) => onNew(payload.new as Message)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/** Lists the current user's accepted conversations — for the Messages tab.
 *  Runs two queries (as rider, and as driver) and merges them, since a single
 *  .or() across a joined table is unreliable in PostgREST. */
export async function getMyConversations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: new Error('Not signed in') };

  const select = `
    id, status, ride_id, rider_id,
    ride:rides!inner(id, origin_label, destination_label, departure_time, driver_id,
      driver:profiles!rides_driver_id_fkey(full_name)),
    rider:profiles!bookings_rider_id_fkey(full_name)
  `;

  // As a rider — my own accepted bookings
  const asRider = await supabase
    .from('bookings')
    .select(select)
    .eq('rider_id', user.id)
    .in('status', ['accepted', 'completed']);

  // As a driver — accepted bookings on rides I own
  const asDriver = await supabase
    .from('bookings')
    .select(select)
    .eq('ride.driver_id', user.id)
    .in('status', ['accepted', 'completed']);

  const merged = [...(asRider.data ?? []), ...(asDriver.data ?? [])];
  // De-dupe by booking id and sort newest first
  const seen = new Set<string>();
  const unique = merged.filter((b: any) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });

  return { data: unique, error: asRider.error || asDriver.error };
}
