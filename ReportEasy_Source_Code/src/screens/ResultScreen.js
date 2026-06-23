import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Share, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabase';

export default function ResultScreen({ route, navigation }) {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  async function fetchReport() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (!error) setReport(data);
    setLoading(false);
  }

  function statusColor(status) {
    if (status === 'critical') return COLORS.red;
    if (status === 'high' || status === 'low') return COLORS.amber;
    return COLORS.teal;
  }

  function statusIcon(status) {
    if (status === 'critical') return 'alert-circle';
    if (status === 'high') return 'arrow-up-circle';
    if (status === 'low') return 'arrow-down-circle';
    return 'checkmark-circle';
  }

  function urgencyColor(u) {
    if (u === 'urgent') return COLORS.red;
    if (u === 'soon') return COLORS.amber;
    return COLORS.teal;
  }

  function urgencyBg(u) {
    if (u === 'urgent') return COLORS.redDim;
    if (u === 'soon') return COLORS.amberDim;
    return COLORS.tealDim;
  }

  async function handleShare() {
    if (!report) return;
    const params = report.parameters || [];
    const abnormal = params.filter(p => p.status !== 'normal');
    const text = [
      `📋 Lab Report Summary — ReportEasy`,
      ``,
      `${report.summary}`,
      ``,
      abnormal.length > 0 ? `⚠️ Values to note:` : `✅ All values in normal range`,
      ...abnormal.map(p => `• ${p.name}: ${p.value} — ${p.explanation}`),
      ``,
      `Questions for my doctor:`,
      ...(report.doctor_questions || []).map((q, i) => `${i + 1}. ${q}`),
      ``,
      `Explained by ReportEasy — reporteasy.in`,
    ].join('\n');

    await Share.share({ message: text, title: 'My Lab Report — ReportEasy' });
  }

  if (loading) {
    return (
      <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </LinearGradient>
    );
  }

  if (!report) {
    return (
      <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={[styles.flex, styles.center]}>
        <Text style={styles.errorText}>Report not found.</Text>
      </LinearGradient>
    );
  }

  const params = report.parameters || [];
  const abnormal = params.filter(p => p.status !== 'normal');
  const normal = params.filter(p => p.status === 'normal');

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={COLORS.teal} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{report.file_name || 'Lab Report'}</Text>
          <Text style={styles.date}>
            {new Date(report.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} · {report.language}
          </Text>

          {/* Urgency banner */}
          <View style={[styles.urgencyBanner, { backgroundColor: urgencyBg(report.urgency) }]}>
            <Ionicons
              name={report.urgency === 'urgent' ? 'alert-circle' : report.urgency === 'soon' ? 'time' : 'checkmark-circle'}
              size={20} color={urgencyColor(report.urgency)} style={{ marginRight: 10 }}
            />
            <Text style={[styles.urgencyText, { color: urgencyColor(report.urgency) }]}>
              {report.urgency_note}
            </Text>
          </View>

          {/* Summary card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Overview</Text>
            <Text style={styles.summaryText}>{report.summary}</Text>
          </View>

          {/* Stats bar */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{params.length}</Text>
              <Text style={styles.statLabel}>Parameters</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: COLORS.teal }]}>{normal.length}</Text>
              <Text style={styles.statLabel}>Normal</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: COLORS.amber }]}>{abnormal.length}</Text>
              <Text style={styles.statLabel}>Need attention</Text>
            </View>
          </View>

          {/* Abnormal values first */}
          {abnormal.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⚠️ Values to discuss with your doctor</Text>
              {abnormal.map((param, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.paramCard, { borderLeftColor: statusColor(param.status) }]}
                  onPress={() => setExpandedIdx(expandedIdx === `a${idx}` ? null : `a${idx}`)}
                >
                  <View style={styles.paramTop}>
                    <Ionicons name={statusIcon(param.status)} size={20} color={statusColor(param.status)} style={{ marginRight: 10 }} />
                    <View style={styles.paramInfo}>
                      <Text style={styles.paramName}>{param.name}</Text>
                      <Text style={[styles.paramValue, { color: statusColor(param.status) }]}>{param.value}</Text>
                    </View>
                    <View style={styles.paramRight}>
                      <Text style={styles.normalRange}>Normal: {param.normalRange}</Text>
                      <Ionicons name={expandedIdx === `a${idx}` ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
                    </View>
                  </View>
                  {expandedIdx === `a${idx}` && (
                    <Text style={styles.paramExplanation}>{param.explanation}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Normal values */}
          {normal.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>✅ Normal values</Text>
              {normal.map((param, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.paramCard, { borderLeftColor: COLORS.teal }]}
                  onPress={() => setExpandedIdx(expandedIdx === `n${idx}` ? null : `n${idx}`)}
                >
                  <View style={styles.paramTop}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.teal} style={{ marginRight: 10 }} />
                    <View style={styles.paramInfo}>
                      <Text style={styles.paramName}>{param.name}</Text>
                      <Text style={[styles.paramValue, { color: COLORS.teal }]}>{param.value}</Text>
                    </View>
                    <View style={styles.paramRight}>
                      <Text style={styles.normalRange}>Normal: {param.normalRange}</Text>
                      <Ionicons name={expandedIdx === `n${idx}` ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
                    </View>
                  </View>
                  {expandedIdx === `n${idx}` && (
                    <Text style={styles.paramExplanation}>{param.explanation}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Doctor questions */}
          {report.doctor_questions?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>💬 Ask your doctor</Text>
              <View style={styles.questionsCard}>
                {report.doctor_questions.map((q, i) => (
                  <View key={i} style={[styles.questionRow, i < report.doctor_questions.length - 1 && styles.questionBorder]}>
                    <View style={styles.questionNum}>
                      <Text style={styles.questionNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.questionText}>{q}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Medical disclaimer */}
          <View style={styles.disclaimerCard}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.disclaimerText}>
              This explanation is for informational purposes only and is not a substitute for professional medical advice. Always consult your doctor.
            </Text>
          </View>

          {/* Share CTA */}
          <TouchableOpacity style={styles.shareCardBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={COLORS.teal} style={{ marginRight: 10 }} />
            <Text style={styles.shareCardText}>Share this summary with family</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 4 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.tealDim, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  shareBtnText: { color: COLORS.tealLight, fontSize: 13, fontWeight: '600', marginLeft: 6 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.3, marginBottom: 6 },
  date: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  urgencyBanner: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  urgencyText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  summaryCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 0.5, borderColor: COLORS.border },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  summaryText: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 24 },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 0.5, borderColor: COLORS.border },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statDivider: { width: 0.5, backgroundColor: COLORS.border, marginVertical: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  paramCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 0.5, borderColor: COLORS.border, borderLeftWidth: 3,
  },
  paramTop: { flexDirection: 'row', alignItems: 'flex-start' },
  paramInfo: { flex: 1 },
  paramName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  paramValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  paramRight: { alignItems: 'flex-end' },
  normalRange: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  paramExplanation: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  questionsCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 0.5, borderColor: COLORS.border },
  questionRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
  questionBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  questionNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.tealDim, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1 },
  questionNumText: { fontSize: 12, fontWeight: '700', color: COLORS.teal },
  questionText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },
  disclaimerCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.bgCardAlt, borderRadius: 12, padding: 14, marginBottom: 16 },
  disclaimerText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  shareCardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.tealDim, borderRadius: 14, padding: 16,
  },
  shareCardText: { color: COLORS.tealLight, fontSize: 15, fontWeight: '600' },
  errorText: { color: COLORS.red, fontSize: 16 },
});
