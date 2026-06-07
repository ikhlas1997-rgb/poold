import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { Colors, Brand } from '../utils/theme';

const { height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(16)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(20)).current;
  const glowPulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(textY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(btnY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1.08, duration: 2200, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Ambient glow behind logo */}
      <Animated.View style={[styles.glow, { opacity: logoOpacity, transform: [{ scale: glowPulse }] }]} />

      {/* LOGO */}
      <Animated.View style={[
        styles.logoWrap,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] }
      ]}>
        <Image
          source={require('../../assets/logo/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* WORDMARK */}
      <Animated.View style={[
        styles.textWrap,
        { opacity: textOpacity, transform: [{ translateY: textY }] }
      ]}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordPool}>Pool</Text>
          <Text style={styles.wordD}>D</Text>
        </View>
        <Text style={styles.arabic}>{Brand.nameArabic}</Text>
        <Text style={styles.tagline}>{Brand.tagline}</Text>
      </Animated.View>

      {/* BOTTOM ACTIONS */}
      <Animated.View style={[
        styles.bottom,
        { opacity: btnOpacity, transform: [{ translateY: btnY }] }
      ]}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onFinish} activeOpacity={0.9}>
          <Text style={styles.btnPrimaryText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.7}>
          <Text style={styles.btnSecondaryText}>Sign in to your account</Text>
        </TouchableOpacity>

        <Text style={styles.region}>Available across UAE & GCC</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: Colors.teal,
    opacity: 0.06,
    top: height * 0.16,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 150,
    height: 150,
  },
  textWrap: {
    alignItems: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  wordPool: {
    fontSize: 46,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1.5,
  },
  wordD: {
    fontSize: 46,
    fontWeight: '800',
    color: Colors.teal,
    letterSpacing: -1.5,
  },
  arabic: {
    fontSize: 17,
    color: Colors.teal,
    opacity: 0.7,
    marginBottom: 12,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: Colors.teal,
    borderRadius: 100,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: Colors.bgPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  region: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
