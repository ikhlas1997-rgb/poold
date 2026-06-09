import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { getMyConversations } from '../services/chat';
import { getUnreadMessageCountsByBooking } from '../services/notifications';
import { supabase } from '../services/supabase';

export default function MessagesScreen({ onOpenChat }: { onOpenChat?: (conv: any) => void }) {
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [unreadByBooking, setUnreadByBooking] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setMyId(user?.id ?? null);
    const { data } = await getMyConversations();
    setConvos(data);
    const counts = await getUnreadMessageCountsByBooking();
    setUnreadByBooking(counts);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Messages</Text></View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
      ) : convos.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}><Ionicons name="chatbubble-outline" size={32} color={Colors.teal} /></View>
          <Text style={styles.emptyText}>No conversations yet. Once a ride request is accepted, you can chat here to coordinate.</Text>
        </View>
      ) : (
        <FlatList
          data={convos}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.teal} />}
          renderItem={({ item }) => {
            const iAmDriver = item.ride?.driver_id === myId;
            const otherName = iAmDriver ? (item.rider?.full_name || 'Rider') : (item.ride?.driver?.full_name || 'Driver');
            const initials = otherName.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
            const route = `${item.ride?.origin_label} → ${item.ride?.destination_label}`;
            const unread = unreadByBooking[item.id] || 0;
            return (
              <TouchableOpacity
                style={[styles.row, unread > 0 && styles.rowUnread]}
                activeOpacity={0.8}
                onPress={() => onOpenChat?.({ bookingId: item.id, otherName, routeLabel: route })}
              >
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, unread > 0 && styles.nameUnread]}>{otherName}</Text>
                    {unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.route, unread > 0 && styles.routeUnread]} numberOfLines={1}>
                    {unread > 0 ? `${unread} new message${unread > 1 ? 's' : ''}` : route}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(4,214,191,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.teal },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  route: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  routeUnread: { color: Colors.teal, fontWeight: '600' },
  rowUnread: { borderColor: Colors.teal },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameUnread: { fontWeight: '800' },
  unreadBadge: { backgroundColor: Colors.error, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.white },
});
