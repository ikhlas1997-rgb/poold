import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { getMessages, sendMessage, subscribeToMessages, Message } from '../services/chat';
import { supabase } from '../services/supabase';

export default function ChatScreen({
  bookingId, otherName, routeLabel, onBack,
}: {
  bookingId: string;
  otherName: string;
  routeLabel?: string;
  onBack?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  // Load history + subscribe to realtime
  useEffect(() => {
    let unsub: (() => void) | undefined;
    getMessages(bookingId).then(({ data }) => {
      setMessages(data);
      setLoading(false);
    });
    unsub = subscribeToMessages(bookingId, (m) => {
      setMessages((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev; // avoid dupes
        return [...prev, m];
      });
    });
    return () => { unsub?.(); };
  }, [bookingId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    // optimistic — realtime will also deliver it, dedupe handles overlap
    const { data } = await sendMessage(bookingId, body);
    if (data) {
      setMessages((prev) => prev.some((x) => x.id === data.id) ? prev : [...prev, data]);
    }
  };

  const initials = (otherName || '?').split(' ').map((n) => n[0]).slice(0, 2).join('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{otherName}</Text>
          {!!routeLabel && <Text style={styles.headerRoute} numberOfLines={1}>{routeLabel}</Text>}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={32} color={Colors.teal} /></View>
            <Text style={styles.emptyText}>Say hello and coordinate your pick-up point.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const mine = item.sender_id === myId;
              return (
                <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                    <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                      {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name="arrow-up" size={20} color={text.trim() ? Colors.bgPrimary : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.teal },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  headerRoute: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(4,214,191,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  bubbleRow: { marginBottom: 10, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: Colors.teal, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMine: { color: Colors.bgPrimary },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(0,7,25,0.5)' },

  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
});
