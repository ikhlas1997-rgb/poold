import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Colors } from '../utils/theme';
import { updateMyProfile } from '../services/supabase';

type Role = 'rider' | 'driver' | 'both';
type Gender = 'male' | 'female' | 'prefer_not_to_say';

const CITIES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'RAK', 'Fujairah', 'Other'];

export default function ProfileSetupScreen({ onDone }: { onDone?: () => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('rider');
  const [gender, setGender] = useState<Gender | null>(null);
  const [city, setCity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSave = name.trim().length >= 2 && !!city;

  const handleSave = async () => {
    if (!canSave) return;
    setLoading(true);
    setError('');
    const { error } = await updateMyProfile({
      full_name: name.trim(),
      role,
      gender: gender ?? undefined,
      city,
      country: 'AE',
    });
    setLoading(false);
    if (error) {
      setError(error.message || 'Could not save. Please try again.');
      return;
    }
    onDone?.();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself so we can match you with the right rides.</Text>

        {/* Name */}
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ahmed Al Mansoori"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={(t) => { setName(t); setError(''); }}
          autoCapitalize="words"
        />

        {/* Role */}
        <Text style={styles.label}>I want to</Text>
        <View style={styles.roleRow}>
          <RoleCard title="Find rides" sub="I'm a rider" active={role === 'rider'} onPress={() => setRole('rider')} />
          <RoleCard title="Offer rides" sub="I'm a driver" active={role === 'driver'} onPress={() => setRole('driver')} />
          <RoleCard title="Both" sub="Ride & drive" active={role === 'both'} onPress={() => setRole('both')} />
        </View>

        {/* City */}
        <Text style={styles.label}>Your city</Text>
        <View style={styles.chipWrap}>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, city === c && styles.chipActive]}
              onPress={() => setCity(c)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gender (optional) */}
        <Text style={styles.label}>Gender <Text style={styles.optional}>(optional)</Text></Text>
        <Text style={styles.helper}>Used for gender-preference ride matching, a popular safety feature in the region.</Text>
        <View style={styles.genderRow}>
          <GenderPill label="Male" active={gender === 'male'} onPress={() => setGender('male')} />
          <GenderPill label="Female" active={gender === 'female'} onPress={() => setGender('female')} />
          <GenderPill label="Prefer not to say" active={gender === 'prefer_not_to_say'} onPress={() => setGender('prefer_not_to_say')} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, !canSave && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!canSave || loading}
          activeOpacity={0.9}
        >
          {loading ? <ActivityIndicator color={Colors.bgPrimary} />
            : <Text style={[styles.btnText, !canSave && styles.btnTextDisabled]}>Continue</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleCard({ title, sub, active, onPress }: { title: string; sub: string; active: boolean; onPress: () => void; }) {
  return (
    <TouchableOpacity style={[styles.roleCard, active && styles.roleCardActive]} onPress={onPress} activeOpacity={0.85}>
      <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{title}</Text>
      <Text style={[styles.roleSub, active && styles.roleSubActive]}>{sub}</Text>
    </TouchableOpacity>
  );
}

function GenderPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void; }) {
  return (
    <TouchableOpacity style={[styles.genderPill, active && styles.genderPillActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.genderText, active && styles.genderTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10, marginTop: 8 },
  optional: { fontSize: 13, fontWeight: '400', color: Colors.textMuted },
  helper: { fontSize: 12, color: Colors.textMuted, marginBottom: 12, marginTop: -4, lineHeight: 17 },
  input: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 16, color: Colors.textPrimary, marginBottom: 12,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  roleCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 16, paddingVertical: 18, paddingHorizontal: 8, alignItems: 'center',
  },
  roleCardActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  roleTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  roleTitleActive: { color: Colors.textPrimary },
  roleSub: { fontSize: 11, color: Colors.textMuted },
  roleSubActive: { color: Colors.teal },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10,
  },
  chipActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  chipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.teal, fontWeight: '600' },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  genderPill: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10,
  },
  genderPillActive: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  genderText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  genderTextActive: { color: Colors.teal, fontWeight: '600' },
  errorText: { fontSize: 13, color: Colors.error, marginBottom: 16, textAlign: 'center' },
  btn: { backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  btnText: { color: Colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  btnTextDisabled: { color: Colors.textMuted },
});
