import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen({ navigation }) {
  const [step, setStep] = useState('landing'); // landing | phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for Google OAuth redirect
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        // Check if phone already verified
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_verified')
          .eq('id', session.user.id)
          .single();
        if (profile?.phone_verified) {
          navigation.replace('Home');
        } else {
          setStep('phone');
        }
      }
    });
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window?.location?.origin || 'https://reporteasy.vercel.app',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (err) { setError(err.message); setLoading(false); }
  }

  async function handleSendOTP() {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 10) { setError('Enter a valid phone number with country code. e.g. +91 9876543210'); return; }
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithOtp({
      phone: cleaned,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep('otp');
  }

  async function handleVerifyOTP() {
    if (otp.length < 6) { setError('Enter the 6-digit code sent to your phone.'); return; }
    setLoading(true);
    setError('');

    const cleaned = phone.replace(/\s/g, '');
    const { error: err } = await supabase.auth.verifyOtp({
      phone: cleaned,
      token: otp,
      type: 'sms',
    });

    if (err) { setError('Invalid or expired code. Try again.'); setLoading(false); return; }

    // Mark phone as verified
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await supabase.from('profiles').update({
        phone_verified: true,
        phone: cleaned,
        free_used: false,
        credits_remaining: 0,
      }).eq('id', currentUser.id);
    }

    setLoading(false);
    navigation.replace('Home');
  }

  // LANDING SCREEN
  if (step === 'landing') {
    return (
      <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <ScrollView contentContainerStyle={styles.container}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>Report<Text style={styles.logoAccent}>Easy</Text></Text>
            </View>

            {/* Hero */}
            <View style={styles.heroWrap}>
              <Text style={styles.heroEmoji}>🩺</Text>
              <Text style={styles.heroTitle}>Understand your{'\n'}lab report</Text>
              <Text style={styles.heroSub}>Plain language. Your language.{'\n'}In 60 seconds.</Text>
            </View>

            {/* Features */}
            <View style={styles.featuresWrap}>
              {[
                { icon: '🌍', text: '95+ languages supported' },
                { icon: '🔒', text: 'Your reports stay private' },
                { icon: '🎁', text: '1 free report on signup' },
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Google Login Button */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={loading}>
              <View style={styles.googleBtnInner}>
                {loading
                  ? <ActivityIndicator color="#1A1A1A" />
                  : <>
                      <Text style={styles.googleIcon}>G</Text>
                      <Text style={styles.googleBtnText}>Continue with Google</Text>
                    </>}
              </View>
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.disclaimer}>
              By continuing you agree to our Terms & Privacy Policy.{'\n'}We never share your medical data.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // PHONE SCREEN
  if (step === 'phone') {
    return (
      <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.container}>
              <View style={styles.logoWrap}>
                <View style={styles.logoDot} />
                <Text style={styles.logoText}>Report<Text style={styles.logoAccent}>Easy</Text></Text>
              </View>

              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>Step 2 of 2</Text>
              </View>

              <Text style={styles.stepTitle}>Verify your phone</Text>
              <Text style={styles.stepSub}>
                This ensures one free report per person.{'\n'}Your number is never shared.
              </Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="+91 9876543210"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading}>
                <LinearGradient colors={['#1D9E75', '#16a076']} style={styles.btnInner}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Send OTP</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.infoCard}>
                <Text style={styles.infoText}>📱 We'll send a 6-digit code to your phone via SMS</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // OTP SCREEN
  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.logoWrap}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>Report<Text style={styles.logoAccent}>Easy</Text></Text>
            </View>

            <View style={styles.otpIconWrap}>
              <Text style={styles.otpIcon}>📲</Text>
            </View>

            <Text style={styles.stepTitle}>Enter OTP</Text>
            <Text style={styles.stepSub}>We sent a 6-digit code to{'\n'}<Text style={styles.phoneHighlight}>{phone}</Text></Text>

            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={COLORS.textMuted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP} disabled={loading}>
              <LinearGradient colors={['#1D9E75', '#16a076']} style={styles.btnInner}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Verify & Continue</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); setError(''); }}>
              <Text style={styles.resendText}>← Change phone number</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSendOTP}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 48 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 36 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1D9E75' },
  logoText: { fontSize: 22, fontWeight: '700', color: '#F9FAFB' },
  logoAccent: { color: '#1D9E75' },
  heroWrap: { alignItems: 'center', marginBottom: 36 },
  heroEmoji: { fontSize: 56, marginBottom: 16 },
  heroTitle: { fontSize: 34, fontWeight: '700', color: '#F9FAFB', textAlign: 'center', letterSpacing: -1, lineHeight: 42, marginBottom: 12 },
  heroSub: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', lineHeight: 24 },
  featuresWrap: { backgroundColor: '#111827', borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 0.5, borderColor: '#1F2937' },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureIcon: { fontSize: 20, marginRight: 14 },
  featureText: { fontSize: 15, color: '#F9FAFB', fontWeight: '500' },
  googleBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  googleBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 12 },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  error: { color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  disclaimer: { fontSize: 12, color: '#4B5563', textAlign: 'center', lineHeight: 18, marginTop: 8 },
  stepBadge: { backgroundColor: '#0f4f3a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 20 },
  stepBadgeText: { color: '#34D399', fontSize: 13, fontWeight: '600' },
  stepTitle: { fontSize: 28, fontWeight: '700', color: '#F9FAFB', letterSpacing: -0.5, marginBottom: 10 },
  stepSub: { fontSize: 15, color: '#9CA3AF', lineHeight: 22, marginBottom: 28 },
  inputWrap: { marginBottom: 16 },
  input: { backgroundColor: '#111827', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, color: '#F9FAFB', fontSize: 18, borderWidth: 0.5, borderColor: '#1F2937' },
  btn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  btnInner: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoCard: { backgroundColor: '#111827', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#1F2937' },
  infoText: { color: '#9CA3AF', fontSize: 13, lineHeight: 20 },
  otpIconWrap: { alignItems: 'center', marginBottom: 24 },
  otpIcon: { fontSize: 56 },
  otpInput: { backgroundColor: '#111827', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, color: '#F9FAFB', fontSize: 32, letterSpacing: 12, textAlign: 'center', borderWidth: 0.5, borderColor: '#1F2937', marginBottom: 16 },
  phoneHighlight: { color: '#1D9E75', fontWeight: '600' },
  resendText: { color: '#1D9E75', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
});
