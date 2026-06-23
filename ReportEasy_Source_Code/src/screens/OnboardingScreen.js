import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  SafeAreaView, TextInput, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, LANGUAGES } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=language
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('English');

  const filtered = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase()) ||
    l.region.toLowerCase().includes(search.toLowerCase())
  );

  async function handleContinue() {
    await AsyncStorage.setItem('language', selected);
    await AsyncStorage.setItem('onboarded', 'true');
    navigation.replace('Auth');
  }

  if (step === 0) {
    return (
      <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.welcomeContainer}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>Report<Text style={styles.logoAccent}>Easy</Text></Text>
            </View>

            {/* Pulse animation placeholder */}
            <View style={styles.pulseWrap}>
              <LinearGradient
                colors={['transparent', COLORS.tealDim, 'transparent']}
                style={styles.pulseBar}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              />
              <View style={styles.pulseCircle} />
            </View>

            <Text style={styles.headline}>Understand your{'\n'}lab report.</Text>
            <Text style={styles.headline2}>In your language. Instantly.</Text>

            <Text style={styles.subtext}>
              Upload any blood test or lab report — get a plain-language explanation in 60 seconds.
            </Text>

            <View style={styles.pillRow}>
              {['95+ languages', '1 free report', 'Any lab format'].map(t => (
                <View key={t} style={styles.pill}>
                  <Text style={styles.pillText}>{t}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
              <LinearGradient colors={[COLORS.teal, '#16a076']} style={styles.primaryBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryBtnText}>Get started — it's free</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By continuing you agree to our Terms & Privacy Policy. We never share your data.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.langContainer}>
          <Text style={styles.langTitle}>Choose your language</Text>
          <Text style={styles.langSub}>We'll explain your reports in this language</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            numColumns={2}
            columnWrapperStyle={styles.langRow}
            style={styles.langList}
            renderItem={({ item }) => {
              const isSelected = selected === item.code;
              return (
                <TouchableOpacity
                  style={[styles.langCard, isSelected && styles.langCardSelected]}
                  onPress={() => setSelected(item.code)}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                    {item.label}
                  </Text>
                  <Text style={styles.langRegion}>{item.region}</Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
            <LinearGradient colors={[COLORS.teal, '#16a076']} style={styles.primaryBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.primaryBtnText}>Continue with {LANGUAGES.find(l => l.code === selected)?.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  welcomeContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24, justifyContent: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.teal },
  logoText: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },
  logoAccent: { color: COLORS.teal },
  pulseWrap: { alignItems: 'center', marginBottom: 36, position: 'relative', height: 40 },
  pulseBar: { height: 2, width: '80%', borderRadius: 1, position: 'absolute', top: 19 },
  pulseCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.teal, position: 'absolute', top: 13, left: '50%', marginLeft: -7 },
  headline: { fontSize: 38, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -1, lineHeight: 46 },
  headline2: { fontSize: 38, fontWeight: '700', color: COLORS.teal, letterSpacing: -1, lineHeight: 46, marginBottom: 20 },
  subtext: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 28 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 },
  pill: { backgroundColor: COLORS.tealDim, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { color: COLORS.tealLight, fontSize: 13, fontWeight: '500' },
  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  primaryBtnInner: { paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },

  langContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  langTitle: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  langSub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 20 },
  searchInput: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: COLORS.textPrimary, fontSize: 15, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 16,
  },
  langList: { flex: 1 },
  langRow: { gap: 10, marginBottom: 10 },
  langCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center',
  },
  langCardSelected: { borderColor: COLORS.teal, backgroundColor: COLORS.tealDim },
  langFlag: { fontSize: 24, marginBottom: 6 },
  langLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  langLabelSelected: { color: COLORS.tealLight },
  langRegion: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
});
