import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, ScrollView, ActivityIndicator,
} from 'react-native';
import { Colors } from '../utils/theme';
import { signUpWithPassword, signInWithPassword, sendPasswordReset } from '../services/supabase';

type Mode = 'signin' | 'signup';

export default function AuthScreen({ onAuthed }: { onAuthed?: () => void }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPw = password.length >= 6;
  const canSubmit = mode === 'signin'
    ? validEmail && validPw
    : validEmail && validPw && password === confirm;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true); setError(''); setNotice('');

    if (mode === 'signup') {
      const { error } = await signUpWithPassword(email, password);
      setLoading(false);
      if (error) { setError(error.message); return; }
      onAuthed?.();
    } else {
      const { error } = await signInWithPassword(email, password);
      setLoading(false);
      if (error) { setError('Incorrect email or password.'); return; }
      onAuthed?.();
    }
  };

  const handleForgot = async () => {
    if (!validEmail) { setError('Enter your email first, then tap reset.'); return; }
    setError('');
    const { error } = await sendPasswordReset(email);
    if (error) { setError(error.message); return; }
    setNotice('If an account exists, a reset link has been sent.');
  };

  const switchMode = (m: Mode) => {
    setMode(m); setError(''); setNotice(''); setPassword(''); setConfirm('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin'
              ? 'Sign in to continue sharing rides across the UAE & GCC.'
              : 'Join PoolD and start sharing rides across the UAE & GCC.'}
          </Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity style={[styles.toggleBtn, mode === 'signin' && styles.toggleActive]} onPress={() => switchMode('signin')}>
            <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, mode === 'signup' && styles.toggleActive]} onPress={() => switchMode('signup')}>
            <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.pwRow}>
          <TextInput
            style={styles.pwInput}
            placeholder="At least 6 characters"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showPw}
            autoCapitalize="none"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
          />
          <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm (signup only) */}
        {mode === 'signup' && (
          <>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              value={confirm}
              onChangeText={(t) => { setConfirm(t); setError(''); }}
            />
            {confirm.length > 0 && password !== confirm && (
              <Text style={styles.helper}>Passwords don't match yet.</Text>
            )}
          </>
        )}

        {/* Forgot password (signin only) */}
        {mode === 'signin' && (
          <TouchableOpacity onPress={handleForgot} style={styles.forgot}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          activeOpacity={0.9}
        >
          {loading ? <ActivityIndicator color={Colors.bgPrimary} />
            : <Text style={[styles.btnText, !canSubmit && styles.btnTextDisabled]}>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Text>}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to PoolD's Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 76, height: 76, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },

  toggle: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  toggleBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.bgSecondary },
  toggleText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.textPrimary },

  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, color: Colors.textPrimary },
  pwRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingRight: 14 },
  pwInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, color: Colors.textPrimary },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
  helper: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },

  forgot: { alignSelf: 'flex-end', marginTop: 12 },
  forgotText: { fontSize: 13, color: Colors.teal, fontWeight: '600' },

  errorText: { fontSize: 13, color: Colors.error, marginTop: 16, textAlign: 'center' },
  noticeText: { fontSize: 13, color: Colors.teal, marginTop: 16, textAlign: 'center' },

  btn: { backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 17, alignItems: 'center', marginTop: 20 },
  btnDisabled: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  btnText: { color: Colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  btnTextDisabled: { color: Colors.textMuted },

  terms: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 16, marginTop: 20, paddingHorizontal: 20 },
});
