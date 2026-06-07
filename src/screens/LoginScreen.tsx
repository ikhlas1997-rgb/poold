import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../utils/theme';
import { sendEmailOtp } from '../services/supabase';

type Method = 'email' | 'whatsapp' | 'phone';

export default function LoginScreen({ onCodeSent }: { onCodeSent?: (email: string) => void }) {
  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canContinue = method === 'email' && isValidEmail;

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError('');
    const { error } = await sendEmailOtp(email.trim());
    setLoading(false);
    if (error) {
      setError(error.message || 'Could not send code. Please try again.');
      return;
    }
    onCodeSent?.(email.trim());
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Welcome to PoolD</Text>
          <Text style={styles.subtitle}>Sign in or create an account to start sharing rides across the UAE & GCC.</Text>
        </View>

        <View style={styles.tabs}>
          <Tab label="Email" active={method === 'email'} onPress={() => { setMethod('email'); setError(''); }} />
          <Tab label="WhatsApp" active={method === 'whatsapp'} badge="Soon" onPress={() => { setMethod('whatsapp'); setError(''); }} />
          <Tab label="Phone" active={method === 'phone'} badge="Soon" onPress={() => { setMethod('phone'); setError(''); }} />
        </View>

        {method === 'email' && (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
            />
            {error
              ? <Text style={styles.errorText}>{error}</Text>
              : <Text style={styles.helper}>We'll send you a 6-digit code to verify your email. No password needed.</Text>}
          </View>
        )}

        {(method === 'whatsapp' || method === 'phone') && (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonTitle}>{method === 'whatsapp' ? 'WhatsApp verification' : 'Phone verification'}</Text>
            <Text style={styles.comingSoonText}>
              {method === 'whatsapp'
                ? 'Sign in with a code sent to your WhatsApp. Launching soon — use email for now.'
                : 'Sign in with an SMS code. Launching soon — use email for now.'}
            </Text>
            <TouchableOpacity onPress={() => setMethod('email')}>
              <Text style={styles.comingSoonLink}>Continue with email instead →</Text>
            </TouchableOpacity>
          </View>
        )}

        {method === 'email' && (
          <TouchableOpacity
            style={[styles.btn, !canContinue && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue || loading}
            activeOpacity={0.9}
          >
            {loading ? <ActivityIndicator color={Colors.bgPrimary} />
              : <Text style={[styles.btnText, !canContinue && styles.btnTextDisabled]}>Send code</Text>}
          </TouchableOpacity>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
          <Text style={styles.socialText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
          <Text style={styles.socialText}>Continue with Apple</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>By continuing you agree to PoolD's Terms of Service and Privacy Policy.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Tab({ label, active, badge, onPress }: { label: string; active: boolean; badge?: string; onPress: () => void; }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {badge && <Text style={styles.tabBadge}>{badge}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 84, height: 84, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
  tabActive: { backgroundColor: Colors.bgSecondary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.textPrimary },
  tabBadge: { fontSize: 9, fontWeight: '700', color: Colors.teal, backgroundColor: 'rgba(4,214,191,0.12)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, overflow: 'hidden' },
  inputBlock: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, color: Colors.textPrimary },
  inputError: { borderColor: Colors.error },
  helper: { fontSize: 12, color: Colors.textMuted, marginTop: 8, lineHeight: 17 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 8, lineHeight: 17 },
  comingSoon: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 24, alignItems: 'center', marginBottom: 20 },
  comingSoonTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  comingSoonText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  comingSoonLink: { fontSize: 14, fontWeight: '600', color: Colors.teal },
  btn: { backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 17, alignItems: 'center', marginBottom: 24 },
  btnDisabled: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  btnText: { color: Colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  btnTextDisabled: { color: Colors.textMuted },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textMuted },
  socialBtn: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  socialText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  terms: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 16, marginTop: 16, paddingHorizontal: 20 },
});
