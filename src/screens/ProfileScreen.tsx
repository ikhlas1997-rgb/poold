import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { getMyProfile, updateMyProfile, getMyEmail, signOut, Profile } from '../services/supabase';

type Role = 'rider' | 'driver' | 'both';
const CITIES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'RAK', 'Fujairah', 'Other'];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // editable fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('rider');
  const [city, setCity] = useState('');

  const load = useCallback(async () => {
    const [{ data }, mail] = await Promise.all([getMyProfile(), getMyEmail()]);
    if (data) {
      setProfile(data);
      setName(data.full_name || '');
      setRole(data.role);
      setCity(data.city || '');
    }
    setEmail(mail);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await updateMyProfile({ full_name: name.trim(), role, city });
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    if (data) setProfile(data);
    setEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
      </SafeAreaView>
    );
  }

  const initials = (profile?.full_name || '?').split(' ').map(n => n[0]).slice(0, 2).join('');
  const roleLabel = role === 'both' ? 'Rider & Driver' : role === 'driver' ? 'Driver' : 'Rider';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.teal} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
              <Ionicons name="create-outline" size={18} color={Colors.teal} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar + name */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
          ) : (
            <Text style={styles.name}>{profile?.full_name || 'Your name'}</Text>
          )}
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Stats */}
        {!editing && (
          <View style={styles.statsCard}>
            <Stat value={Number(profile?.rating ?? 5).toFixed(1)} label="Rating" icon="star" />
            <View style={styles.statDivider} />
            <Stat value={`${profile?.total_rides ?? 0}`} label="Rides" icon="car" />
            <View style={styles.statDivider} />
            <Stat value={roleLabel} label="Role" icon="person" small />
          </View>
        )}

        {/* Edit mode: role + city */}
        {editing ? (
          <>
            <Text style={styles.label}>I want to</Text>
            <View style={styles.roleRow}>
              <RoleCard title="Find rides" active={role === 'rider'} onPress={() => setRole('rider')} />
              <RoleCard title="Offer rides" active={role === 'driver'} onPress={() => setRole('driver')} />
              <RoleCard title="Both" active={role === 'both'} onPress={() => setRole('both')} />
            </View>

            <Text style={styles.label}>City</Text>
            <View style={styles.chipWrap}>
              {CITIES.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, city === c && styles.chipActive]} onPress={() => setCity(c)}>
                  <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); load(); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.bgPrimary} /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Detail rows */}
            <View style={styles.section}>
              <DetailRow icon="location-outline" label="City" value={profile?.city || 'Not set'} />
              <DetailRow icon="globe-outline" label="Country" value={profile?.country === 'AE' ? 'United Arab Emirates' : (profile?.country || 'UAE')} />
              <DetailRow icon="shield-checkmark-outline" label="Verification" value={profile?.is_verified ? 'Verified' : 'Not verified'} last />
            </View>

            {/* Settings */}
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.section}>
              <MenuRow icon="notifications-outline" label="Notifications" />
              <MenuRow icon="shield-outline" label="Privacy & safety" />
              <MenuRow icon="card-outline" label="Payment methods" />
              <MenuRow icon="help-circle-outline" label="Help & support" last />
            </View>

            {/* About */}
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.section}>
              <MenuRow icon="document-text-outline" label="Terms of Service" />
              <MenuRow icon="lock-closed-outline" label="Privacy Policy" last />
            </View>

            {/* Sign out */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>PoolD v1.0.0 · بول دي</Text>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label, icon, small }: { value: string; label: string; icon: any; small?: boolean }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={Colors.teal} />
      <Text style={[styles.statValue, small && { fontSize: 13 }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Ionicons name={icon} size={20} color={Colors.textSecondary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MenuRow({ icon, label, last }: { icon: any; label: string; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.menuRow, !last && styles.rowBorder]} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={Colors.textSecondary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function RoleCard({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.roleCard, active && styles.roleCardActive]} onPress={onPress}>
      <Text style={[styles.roleText, active && styles.roleTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editText: { fontSize: 15, color: Colors.teal, fontWeight: '600' },

  avatarBlock: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.bgSecondary, borderWidth: 2, borderColor: Colors.teal, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { fontSize: 30, fontWeight: '800', color: Colors.teal },
  name: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  nameInput: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.teal, textAlign: 'center', minWidth: 200, paddingVertical: 4 },
  email: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  statsCard: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingVertical: 18, marginBottom: 24 },
  stat: { flex: 1, alignItems: 'center', gap: 5 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  label: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  roleCardActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  roleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  roleTextActive: { color: Colors.teal },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10 },
  chipActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  chipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.teal, fontWeight: '600' },

  editActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 100, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 16, borderRadius: 100, backgroundColor: Colors.teal, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.bgPrimary },

  section: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10, marginLeft: 4 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  detailLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  detailValue: { fontSize: 14, color: Colors.textSecondary },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 16, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,90,90,0.3)' },
  signOutText: { fontSize: 16, fontWeight: '700', color: Colors.error },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 20 },
});
