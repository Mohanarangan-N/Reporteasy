import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  SafeAreaView, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const credits = profile?.credits_remaining ?? 0;
  const freeUsed = profile?.free_used ?? false;
  const totalCredits = freeUsed ? credits : credits + 1;

  async function fetchReports() {
    if (!user) return;
    const { data } = await supabase
      .from('reports')
      .select('id, created_at, summary, urgency, language, file_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setReports(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchReports(); }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [user]);

  function urgencyColor(u) {
    if (u === 'urgent') return COLORS.red;
    if (u === 'soon') return COLORS.amber;
    return COLORS.teal;
  }

  function urgencyLabel(u) {
    if (u === 'urgent') return '🔴 See doctor urgently';
    if (u === 'soon') return '🟡 Follow up soon';
    return '🟢 Routine';
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const canUpload = credits > 0 || !freeUsed;

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Report<Text style={styles.logoAccent}>Easy</Text></Text>
            <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0]} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Account')} style={styles.avatarBtn}>
            <Ionicons name="person-circle-outline" size={32} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Credits card */}
        <View style={styles.creditsCard}>
          <View>
            <Text style={styles.creditsLabel}>Reports available</Text>
            <Text style={styles.creditsNum}>{canUpload ? (freeUsed ? credits : `${credits} + 1 free`) : '0'}</Text>
          </View>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => navigation.navigate('Paywall')}
          >
            <Text style={styles.buyBtnText}>+ Buy more</Text>
          </TouchableOpacity>
        </View>

        {/* Upload CTA */}
        <TouchableOpacity
          style={[styles.uploadBtn, !canUpload && styles.uploadBtnDisabled]}
          onPress={() => canUpload ? navigation.navigate('Upload') : navigation.navigate('Paywall')}
        >
          <LinearGradient
            colors={canUpload ? [COLORS.teal, '#16a076'] : [COLORS.textMuted, '#374151']}
            style={styles.uploadBtnInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Ionicons name="cloud-upload-outline" size={22} color={COLORS.white} style={{ marginRight: 10 }} />
            <Text style={styles.uploadBtnText}>
              {canUpload ? 'Upload a lab report' : 'Buy credits to continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Reports history */}
        <Text style={styles.sectionTitle}>Your reports</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.teal} style={{ marginTop: 40 }} />
        ) : reports.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptySub}>Upload your first lab report to get a plain-language explanation.</Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.reportCard}
                onPress={() => navigation.navigate('Result', { reportId: item.id })}
              >
                <View style={styles.reportCardTop}>
                  <View style={styles.reportIcon}>
                    <Ionicons name="document-text" size={20} color={COLORS.teal} />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportName} numberOfLines={1}>
                      {item.file_name || 'Lab Report'}
                    </Text>
                    <Text style={styles.reportDate}>{formatDate(item.created_at)} · {item.language}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </View>
                <Text style={styles.reportSummary} numberOfLines={2}>{item.summary}</Text>
                <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor(item.urgency) + '22' }]}>
                  <Text style={[styles.urgencyText, { color: urgencyColor(item.urgency) }]}>
                    {urgencyLabel(item.urgency)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logoText: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  logoAccent: { color: COLORS.teal },
  greeting: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  avatarBtn: { padding: 4 },
  creditsCard: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.bgCard,
    borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border,
  },
  creditsLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  creditsNum: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  buyBtn: { backgroundColor: COLORS.tealDim, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  buyBtnText: { color: COLORS.tealLight, fontSize: 13, fontWeight: '600' },
  uploadBtn: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnInner: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  uploadBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: 20, marginBottom: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  reportCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  reportCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reportIcon: { backgroundColor: COLORS.tealDim, borderRadius: 10, padding: 8, marginRight: 12 },
  reportInfo: { flex: 1 },
  reportName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  reportDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  reportSummary: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 10 },
  urgencyBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  urgencyText: { fontSize: 12, fontWeight: '500' },
});
