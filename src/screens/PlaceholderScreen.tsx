import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';

export default function PlaceholderScreen({
  title,
  icon,
  message,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={36} color={Colors.teal} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(4,214,191,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  message: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
