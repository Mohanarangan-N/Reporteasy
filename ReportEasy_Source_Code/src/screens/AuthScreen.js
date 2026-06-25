import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabase';

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAuth() {
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password });
      if (err) { setError(err.message); setLoading(false); return; }
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigation.replace('Home');
  }

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={{flex:1}}>
      <SafeAreaView style={{flex:1}}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.logoWrap}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>Report<Text style={{color:'#1D9E75'}}>Easy</Text></Text>
            </View>
            <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
            <Text style={styles.sub}>{mode === 'login' ? 'Sign in to continue' : 'Start with 1 free report'}</Text>
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#4B5563"
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password (min 6 characters)" placeholderTextColor="#4B5563"
              value={password} onChangeText={setPassword} secureTextEntry />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
              <LinearGradient colors={['#1D9E75','#16a076']} style={styles.btnInner}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              <Text style={styles.switchText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{color:'#1D9E75',fontWeight:'600'}}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>🎁 1 free report on signup — no credit card</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow:1, paddingHorizontal:24, justifyContent:'center', paddingVertical:40 },
  logoWrap: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:40 },
  logoDot: { width:10, height:10, borderRadius:5, backgroundColor:'#1D9E75' },
  logoText: { fontSize:22, fontWeight:'700', color:'#F9FAFB' },
  title: { fontSize:28, fontWeight:'700', color:'#F9FAFB', letterSpacing:-0.5, marginBottom:8 },
  sub: { fontSize:15, color:'#9CA3AF', marginBottom:28 },
  input: { backgroundColor:'#111827', borderRadius:14, paddingHorizontal:16, paddingVertical:14,
    color:'#F9FAFB', fontSize:16, borderWidth:0.5, borderColor:'#1F2937', marginBottom:14 },
  error: { color:'#EF4444', fontSize:13, marginBottom:12 },
  btn: { borderRadius:14, overflow:'hidden', marginBottom:16 },
  btnInner: { paddingVertical:16, alignItems:'center' },
  btnText: { color:'#fff', fontSize:16, fontWeight:'600' },
  switchText: { fontSize:14, color:'#9CA3AF', textAlign:'center', marginBottom:24 },
  freeBadge: { backgroundColor:'#0f4f3a', borderRadius:14, paddingVertical:14, paddingHorizontal:20, alignItems:'center' },
  freeBadgeText: { color:'#34D399', fontSize:14, fontWeight:'500' },
});
