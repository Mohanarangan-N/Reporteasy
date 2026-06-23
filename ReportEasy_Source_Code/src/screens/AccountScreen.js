import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LANGUAGES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountScreen({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const [langModal, setLangModal] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');

  React.useEffect(() => {
    AsyncStorage.getItem('language').then(l => l && setCurrentLang(l));
  }, []);

  async function changeLang(lang) {
    await AsyncStorage.setItem('language', lang);
    setCurrentLang(lang);
    setLangModal(false);
  }

  const lang = LANGUAGES.find(l => l.code === currentLang);

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Account</Text>

          {/* User card */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userSub}>Member since {new Date(user?.created_at).getFullYear()}</Text>
            </View>
          </View>

          {/* Credits */}
          <View style={styles.creditsCard}>
            <View>
              <Text style={styles.creditsLabel}>Reports remaining</Text>
              <Text style={styles.creditsNum}>{profile?.credits_remaining ?? 0}</Text>
            </View>
            <TouchableOpacity style={styles.buyBtn} onPress={() => navigation.navigate('Paywall')}>
              <Text style={styles.buyBtnText}>Buy more</Text>
            </TouchableOpacity>
          </View>

          {/* Settings list */}
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow} onPress={() => setLangModal(true)}>
              <Ionicons name="language-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 14 }} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Report language</Text>
                <Text style={styles.settingValue}>{lang?.flag} {lang?.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Paywall')}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 14 }} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Billing & plans</Text>
                <Text style={styles.settingValue}>Manage subscription</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 14 }} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={() => { signOut(); navigation.replace('Auth'); }}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.red} style={{ marginRight: 10 }} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>ReportEasy v1.0 · Mora Digital Automations</Text>
        </View>
      </SafeAreaView>

      {/* Language modal */}
      <Modal visible={langModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose language</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={l => l.code}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.langRow, currentLang === item.code && styles.langRowSelected]}
                  onPress={() => changeLang(item.code)}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text style={[styles.langLabel, currentLang === item.code && { color: COLORS.teal }]}>{item.label}</Text>
                  {currentLang === item.code && <Ionicons name="checkmark" size={18} color={COLORS.teal} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setLangModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 20 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 24 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: COLORS.border, gap: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.tealDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.teal, fontSize: 18, fontWeight: '700' },
  userEmail: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  userSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  creditsCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: COLORS.border },
  creditsLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  creditsNum: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  buyBtn: { backgroundColor: COLORS.tealDim, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  buyBtnText: { color: COLORS.tealLight, fontSize: 14, fontWeight: '600' },
  settingsCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 0.5, borderColor: COLORS.border },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  settingValue: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  settingDivider: { height: 0.5, backgroundColor: COLORS.border, marginLeft: 50 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.redDim, borderRadius: 14, padding: 16, marginBottom: 20 },
  signOutText: { color: COLORS.red, fontSize: 15, fontWeight: '600' },
  version: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderRadius: 10, paddingHorizontal: 8 },
  langRowSelected: { backgroundColor: COLORS.tealDim },
  langFlag: { fontSize: 22 },
  langLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  modalClose: { marginTop: 16, padding: 14, backgroundColor: COLORS.bgCardAlt, borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
