import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const PLANS = [
  {
    id: 'single',
    label: 'Single Report',
    price: '$2.99',
    priceIndia: '₹49',
    reports: '1 report',
    desc: 'Perfect for occasional use',
    badge: null,
    icon: 'document-text-outline',
  },
  {
    id: 'bundle',
    label: 'Family Bundle',
    price: '$6.99',
    priceIndia: '₹149',
    reports: '5 reports',
    desc: 'Best for family checkups',
    badge: 'BEST VALUE',
    icon: 'people-outline',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$4.99/mo',
    priceIndia: '₹99/mo',
    reports: 'Up to 10 reports',
    desc: 'For chronic condition monitoring',
    badge: null,
    icon: 'calendar-outline',
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$39.99/yr',
    priceIndia: '₹799/yr',
    reports: 'Unlimited reports',
    desc: 'Save 33% vs monthly',
    badge: 'SAVE 33%',
    icon: 'infinite-outline',
  },
];

export default function PaywallScreen({ navigation }) {
  const [selected, setSelected] = useState('bundle');
  // Detect India (simplistic — replace with real geo-detection)
  const isIndia = false;

  function handlePurchase() {
    // Replace with actual Lemon Squeezy / Razorpay deep link or WebView
    const plan = PLANS.find(p => p.id === selected);
    const checkoutUrl = `https://reporteasy.lemonsqueezy.com/checkout?plan=${selected}`;
    Linking.openURL(checkoutUrl);
  }

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.title}>Choose a plan</Text>
          <Text style={styles.sub}>Get clear explanations for every lab report — in your language</Text>

          <View style={styles.plansWrap}>
            {PLANS.map(plan => {
              const isSelected = selected === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                  onPress={() => setSelected(plan.id)}
                >
                  {plan.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <View style={styles.planTop}>
                    <View style={[styles.planIcon, isSelected && styles.planIconSelected]}>
                      <Ionicons name={plan.icon} size={20} color={isSelected ? COLORS.teal : COLORS.textSecondary} />
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>{plan.label}</Text>
                      <Text style={styles.planReports}>{plan.reports}</Text>
                    </View>
                    <View style={styles.planPriceWrap}>
                      <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                        {isIndia ? plan.priceIndia : plan.price}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.planDesc}>{plan.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.buyBtn} onPress={handlePurchase}>
            <LinearGradient colors={[COLORS.teal, '#16a076']} style={styles.buyBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.buyBtnText}>
                Purchase — {isIndia
                  ? PLANS.find(p => p.id === selected)?.priceIndia
                  : PLANS.find(p => p.id === selected)?.price}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.trustRow}>
            {['Secure payment', 'No subscription trap', 'Instant access'].map(t => (
              <View key={t} style={styles.trustItem}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.teal} style={{ marginRight: 4 }} />
                <Text style={styles.trustText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 20 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 22 },
  plansWrap: { gap: 10, marginBottom: 24 },
  planCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: COLORS.border, position: 'relative', overflow: 'hidden',
  },
  planCardSelected: { borderColor: COLORS.teal, backgroundColor: COLORS.tealDim },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.teal, borderBottomLeftRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  planIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bgCardAlt, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  planIconSelected: { backgroundColor: '#0a2e20' },
  planInfo: { flex: 1 },
  planLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  planLabelSelected: { color: COLORS.tealLight },
  planReports: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  planPriceWrap: { alignItems: 'flex-end' },
  planPrice: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  planPriceSelected: { color: COLORS.teal },
  planDesc: { fontSize: 12, color: COLORS.textSecondary },
  buyBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  buyBtnInner: { paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  trustRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16 },
  trustItem: { flexDirection: 'row', alignItems: 'center' },
  trustText: { fontSize: 12, color: COLORS.textSecondary },
});
