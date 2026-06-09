import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { getNotifications, markRead, markAllRead, Notification } from '../services/notifications';

const ICON: Record<string, { name: any; color: string }> = {
  request:   { name: 'person-add', color: '#04D6BF' },
  accepted:  { name: 'checkmark-circle', color: '#34D98A' },
  rejected:  { name: 'close-circle', color: '#FF5A5A' },
  cancelled: { name: 'close-circle', color: '#FF5A5A' },
  updated:   { name: 'refresh-circle', color: '#016CEB' },
  message:   { name: 'chatbubble', color: '#016CEB' },
};

export default function NotificationsScreen({ onBack, onRefreshBadge, onNavigate }: { onBack?: () => void; onRefreshBadge?: () => void; onNavigate?: (n: Notification) => void }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await getNotifications();
    setItems(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAll = async () => {
    await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onRefreshBadge?.();
  };

  const handleTap = async (n: Notification) => {
    // Mark read on tap — EXCEPT message notifications, which only clear
    // when their chat is actually opened (handled by the navigation target).
    if (n.type !== 'message' && !n.is_read) {
      await markRead(n.id);
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
      onRefreshBadge?.();
    }
    // Navigate to the relevant screen for this notification.
    onNavigate?.(n);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAll} hitSlop={8}>
          <Text style={styles.markAll}>Mark all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}><Ionicons name="notifications-outline" size={32} color={Colors.teal} /></View>
          <Text style={styles.emptyText}>No notifications yet. You'll see ride requests, confirmations, and messages here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.teal} />}
          renderItem={({ item }) => {
            const ic = ICON[item.type] || { name: 'notifications', color: Colors.teal };
            return (
              <TouchableOpacity
                style={[styles.row, !item.is_read && styles.rowUnread]}
                onPress={() => handleTap(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrap, { backgroundColor: ic.color + '22' }]}>
                  <Ionicons name={ic.name} size={20} color={ic.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  {!!item.body && <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>}
                  <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
                </View>
                {!item.is_read && <View style={styles.unreadDot} />}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  markAll: { fontSize: 14, color: Colors.teal, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(4,214,191,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 8 },
  rowUnread: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  notifBody: { fontSize: 13, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
  notifTime: { fontSize: 11, color: Colors.textMuted, marginTop: 5 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.teal },
});
