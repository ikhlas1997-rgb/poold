import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors } from '../utils/theme';
import { verifyEmailOtp, sendEmailOtp } from '../services/supabase';

const CODE_LENGTH = 6;

export default function OtpScreen({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified?: () => void;
  onBack?: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(45);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const code = digits.join('');
  const complete = code.length === CODE_LENGTH;

  const handleChange = (text: string, index: number) => {
    setError('');
    // Handle paste of full code
    if (text.length > 1) {
      const chars = text.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
      const next = Array(CODE_LENGTH).fill('');
      chars.forEach((c, i) => (next[i] = c));
      setDigits(next);
      inputs.current[Math.min(chars.length, CODE_LENGTH - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = text.replace(/\D/g, '');
    setDigits(next);
    if (text && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!complete) return;
    setLoading(true);
    setError('');
    const { error } = await verifyEmailOtp(email, code);
    setLoading(false);
    if (error) {
      setError('Invalid or expired code. Please try again.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
      return;
    }
    onVerified?.();
  };

  // Auto-verify when all 6 digits entered
  useEffect(() => {
    if (complete && !loading) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError('');
    await sendEmailOtp(email);
    setResendIn(45);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}<Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => (inputs.current[i] = r)}
              style={[styles.codeBox, d && styles.codeBoxFilled, error && styles.codeBoxError]}
              value={d}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              textAlign="center"
              autoFocus={i === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ height: 20 }} />}

        <TouchableOpacity
          style={[styles.btn, !complete && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={!complete || loading}
          activeOpacity={0.9}
        >
          {loading ? <ActivityIndicator color={Colors.bgPrimary} />
            : <Text style={[styles.btnText, !complete && styles.btnTextDisabled]}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resendIn > 0} style={styles.resend}>
          <Text style={styles.resendText}>
            {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 72 },
  backBtn: { marginBottom: 32 },
  backText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 40 },
  email: { color: Colors.teal, fontWeight: '600' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  codeBox: {
    width: 48, height: 56, backgroundColor: Colors.bgCard,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    fontSize: 24, fontWeight: '700', color: Colors.textPrimary,
  },
  codeBoxFilled: { borderColor: Colors.teal, backgroundColor: Colors.bgSecondary },
  codeBoxError: { borderColor: Colors.error },
  errorText: { fontSize: 13, color: Colors.error, marginTop: 14, textAlign: 'center', height: 20 },
  btn: { backgroundColor: Colors.teal, borderRadius: 100, paddingVertical: 17, alignItems: 'center', marginTop: 12 },
  btnDisabled: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  btnText: { color: Colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  btnTextDisabled: { color: Colors.textMuted },
  resend: { alignItems: 'center', marginTop: 24 },
  resendText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
});
