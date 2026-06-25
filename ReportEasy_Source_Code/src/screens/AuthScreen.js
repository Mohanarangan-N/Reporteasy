import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabase';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');

    // Try magic link first, fallback to auto-signin
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined,
      },
    });

    if (err) {
      // Fallback: create anonymous-style session for testing
      setError('Email sending failed. Use test@reporteasy.com to test.');
      setLoading(false);
      return;
    }

    setLoading(false);
    navigation.replace('Home');
  }

  async function handleTestLogin() {
    setLoading(true);
    // Sign in with a test account using password auth
    const { error: signUpErr } = await supabase.auth.signUp({
      email: 'test@reporteasy.com',
      password: 'testpass123',
    });

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: 'test@reporteasy.com',
      password: 'testpass123',
    });

    setLoading(false);
    if (!signInErr) {
      navigation.replace('Home');
    } else {
      setError('Test login failed: ' + signInErr.message);
    }
  }

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <View style={styles.container}>
            <View style={styles.logoWrap}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>Report<Text style={styles.logoAccent}>Easy</Text></Text>
            </View>

            <Text style={styles.title}>Sign in to continue</Text>
            <Text style={styles.sub}>Enter your email to get started</Text>

            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={[COLORS.teal, '#16a076']} style={styles.btnInner}>
                {loading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.btnText}>Sign in with Email</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.testBtn} onPress={handleTestLogin} disabled={loading}>
              <Text style={styles.testBtnText}>🧪 Continue as Test User</Text>
            </TouchableOpacity>

            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>🎁 1 free report on signup</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.teal },
  logoText: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  logoAccent: { color: COLORS.teal },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 10 },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 28 },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: COLORS.textPrimary, fontSize: 16, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 16,
  },
  error: { color: COLORS.red, fontSize: 13, marginBottom: 12 },
  btn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  btnInner: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textMuted },
  testBtn: {
    borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border,
    paddingVertical: 16, alignItems: 'center', marginBottom: 24,
    backgroundColor: COLORS.bgCard,
  },
  testBtnText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' },
  freeBadge: {
    backgroundColor: COLORS.tealDim, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center',
  },
  freeBadgeText: { color: COLORS.tealLight, fontSize: 14, fontWeight: '500' },
});
