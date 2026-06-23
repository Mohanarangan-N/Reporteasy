import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen({ navigation }) {
  const { signInWithEmail, verifyOtp } = useAuth();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendOtp() {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signInWithEmail(email.trim().toLowerCase());
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep('otp');
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await verifyOtp(email.trim().toLowerCase(), otp.trim());
    setLoading(false);
    if (err) { setError('Invalid or expired code. Try again.'); return; }
    navigation.replace('Home');
  }

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>Report<Text style={styles.logoAccent}>Easy</Text></Text>
            </View>

            <Text style={styles.title}>{step === 'email' ? 'Sign in to continue' : 'Check your email'}</Text>
            <Text style={styles.sub}>
              {step === 'email'
                ? 'We\'ll send a one-time code to your email — no password needed.'
                : `We sent a 6-digit code to\n${email}`}
            </Text>

            {step === 'email' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity style={styles.btn} onPress={handleSendOtp} disabled={loading}>
                  <LinearGradient colors={[COLORS.teal, '#16a076']} style={styles.btnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading
                      ? <ActivityIndicator color={COLORS.white} />
                      : <Text style={styles.btnText}>Send code</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp} disabled={loading}>
                  <LinearGradient colors={[COLORS.teal, '#16a076']} style={styles.btnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading
                      ? <ActivityIndicator color={COLORS.white} />
                      : <Text style={styles.btnText}>Verify & sign in</Text>}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setStep('email'); setOtp(''); setError(''); }}>
                  <Text style={styles.link}>← Use a different email</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>🎁 You get 1 free report on signup</Text>
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
  sub: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 28 },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: COLORS.textPrimary, fontSize: 16, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 16,
  },
  otpInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  error: { color: COLORS.red, fontSize: 13, marginBottom: 12 },
  btn: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  btnInner: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  link: { color: COLORS.teal, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  freeBadge: {
    marginTop: 28, backgroundColor: COLORS.tealDim, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center',
  },
  freeBadgeText: { color: COLORS.tealLight, fontSize: 14, fontWeight: '500' },
});
