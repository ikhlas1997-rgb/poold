import { supabase } from './supabase';

export type Notification = {
  id: string;
  user_id: string;
  type: 'request' | 'accepted' | 'rejected' | 'message' | string;
  title: string;
  body: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
};

/** Loads the current user's notifications, newest first. */
export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] as Notification[], error: new Error('Not signed in') };
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data: (data ?? []) as Notification[], error };
}

/** Count of unread notifications. */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  return count ?? 0;
}

/** Marks one notification read. */
export async function markRead(id: string) {
  return await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

/** Marks all NON-message notifications read.
 *  Message notifications only clear when their chat is opened. */
export async function markAllRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  return await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .neq('type', 'message');
}

/** Marks message notifications for a specific booking read (called on chat open). */
export async function markMessagesReadForBooking(bookingId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  return await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('type', 'message')
    .filter('data->>booking_id', 'eq', bookingId);
}

/** Per-booking unread message counts -> { [bookingId]: count }. */
export async function getUnreadMessageCountsByBooking(): Promise<Record<string, number>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const { data } = await supabase
    .from('notifications')
    .select('data')
    .eq('user_id', user.id)
    .eq('type', 'message')
    .eq('is_read', false);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((n: any) => {
    const bid = n.data?.booking_id;
    if (bid) counts[bid] = (counts[bid] || 0) + 1;
  });
  return counts;
}

/** Subscribe to new notifications for the current user (realtime). */
export function subscribeToNotifications(userId: string, onNew: (n: Notification) => void) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onNew(payload.new as Notification)
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/** Count of unread notifications of a given type (e.g. 'message'). */
export async function getUnreadCountByType(type: string): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', type)
    .eq('is_read', false);
  return count ?? 0;
}
