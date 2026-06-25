import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Alert, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { explainLabReport } from '../lib/gpt4o';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UploadScreen({ navigation }) {
  const { user, profile, refreshProfile } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [statusMsg, setStatusMsg] = useState('');
  const [file, setFile] = useState(null);

  async function handlePDF() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const picked = result.assets[0];
      setFile({ uri: picked.uri, name: picked.name, type: 'pdf' });
    } catch (e) {
      Alert.alert('Error', 'Could not open the file. Please try again.');
    }
  }

  async function handleCamera() {
    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to photograph your report.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });
    if (result.canceled) return;
    const picked = result.assets[0];
    setFile({ uri: picked.uri, base64: picked.base64, name: 'report-photo.jpg', type: 'image', mimeType: 'image/jpeg' });
  }

  async function handleGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });
    if (result.canceled) return;
    const picked = result.assets[0];
    setFile({ uri: picked.uri, base64: picked.base64, name: 'report-image.jpg', type: 'image', mimeType: 'image/jpeg' });
  }

  async function processReport() {
    if (!file) return;
    setStatus('processing');

    try {
      // Get language preference
      const language = await AsyncStorage.getItem('language') || 'English';

      let text = '';
      let imageBase64 = null;
      let mimeType = null;

      setStatusMsg('Reading your report...');

      if (file.type === 'pdf') {
        // Upload PDF to Supabase storage, then call edge function for text extraction
        const fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const filePath = `${user.id}/${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('reports')
          .upload(filePath, decode(fileContent), { contentType: 'application/pdf' });

        if (uploadError) throw uploadError;

        // Call edge function to extract PDF text
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-pdf', {
          body: { filePath },
        });

        if (extractError) {
          // Fallback: pass as base64 image to Claude vision
          imageBase64 = fileContent;
          mimeType = 'application/pdf';
        } else {
          text = extractData.text;
        }

      } else {
        // Image — use vision directly
        imageBase64 = file.base64;
        mimeType = file.mimeType;
      }

      setStatusMsg('AI is analyzing your report...');

      const result = await explainLabReport({ text, imageBase64, mimeType, language });

      setStatusMsg('Saving your results...');

      // Save to Supabase
      const { data: reportData, error: saveError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          file_name: file.name,
          language,
          summary: result.summary,
          parameters: result.parameters,
          doctor_questions: result.doctorQuestions,
          urgency: result.urgency,
          urgency_note: result.urgencyNote,
          raw_result: result,
        })
        .select('id')
        .single();

      if (saveError) throw saveError;

      // Deduct credit
      const isFreeReport = !profile?.free_used;
      if (isFreeReport) {
        await supabase.from('profiles').update({ free_used: true }).eq('id', user.id);
      } else {
        await supabase.from('profiles').update({
          credits_remaining: (profile?.credits_remaining || 0) - 1
        }).eq('id', user.id);
      }

      await refreshProfile();
      setStatus('done');

      navigation.replace('Result', { reportId: reportData.id });

    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusMsg(e.message || 'Something went wrong. Please try again.');
    }
  }

  // Helper: decode base64 for Supabase upload
  function decode(base64) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    base64 = base64.replace(/[^A-Za-z0-9+/]/g, '');
    while (i < base64.length) {
      const a = chars.indexOf(base64[i++]);
      const b = chars.indexOf(base64[i++]);
      const c = chars.indexOf(base64[i++]);
      const d = chars.indexOf(base64[i++]);
      const bitmap = (a << 18) | (b << 12) | (c << 6) | d;
      result += String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255, bitmap & 255);
    }
    return result;
  }

  if (status === 'processing') {
    return (
      <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
        <SafeAreaView style={[styles.flex, styles.centerAll]}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={COLORS.teal} style={{ marginBottom: 20 }} />
            <Text style={styles.processingTitle}>Analyzing your report</Text>
            <Text style={styles.processingMsg}>{statusMsg}</Text>
            <View style={styles.processingSteps}>
              {['Reading report', 'Understanding values', 'Writing explanation', 'Saving results'].map((s, i) => (
                <View key={s} style={styles.stepRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.teal} style={{ marginRight: 8 }} />
                  <Text style={styles.stepText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.processingDisclaimer}>This takes about 30–60 seconds</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0F1E', '#0d1a2e', '#0A0F1E']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Upload your report</Text>
          <Text style={styles.sub}>Upload a PDF or take a photo of your lab report</Text>

          {/* File selected preview */}
          {file && (
            <View style={styles.filePreview}>
              <Ionicons name={file.type === 'pdf' ? 'document' : 'image'} size={24} color={COLORS.teal} style={{ marginRight: 12 }} />
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => setFile(null)}>
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Upload options */}
          {!file ? (
            <View style={styles.optionGrid}>
              <TouchableOpacity style={styles.optionCard} onPress={handlePDF}>
                <LinearGradient colors={[COLORS.tealDim, '#0d2b1f']} style={styles.optionIcon}>
                  <Ionicons name="document-text" size={28} color={COLORS.teal} />
                </LinearGradient>
                <Text style={styles.optionTitle}>Upload PDF</Text>
                <Text style={styles.optionSub}>From your files</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={handleCamera}>
                <LinearGradient colors={['#1a1a3a', '#0d0d2b']} style={styles.optionIcon}>
                  <Ionicons name="camera" size={28} color="#818CF8" />
                </LinearGradient>
                <Text style={styles.optionTitle}>Take photo</Text>
                <Text style={styles.optionSub}>Using camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={handleGallery}>
                <LinearGradient colors={['#1a0d2b', '#150a24']} style={styles.optionIcon}>
                  <Ionicons name="images" size={28} color="#C084FC" />
                </LinearGradient>
                <Text style={styles.optionTitle}>Choose image</Text>
                <Text style={styles.optionSub}>From gallery</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Supported labs */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Works with any lab</Text>
            <Text style={styles.infoText}>SRL, Thyrocare, Metropolis, LabCorp, Quest, NHS, and any other lab report worldwide.</Text>
          </View>

          {status === 'error' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{statusMsg}</Text>
            </View>
          )}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            ⚠️ ReportEasy explains lab values in plain language. This is not medical advice. Always consult your doctor.
          </Text>

          {/* Analyze button */}
          {file && (
            <TouchableOpacity style={styles.analyzeBtn} onPress={processReport}>
              <LinearGradient colors={[COLORS.teal, '#16a076']} style={styles.analyzeBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="sparkles" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
                <Text style={styles.analyzeBtnText}>Analyze report</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerAll: { justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, paddingBottom: 48 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 28 },
  filePreview: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard,
    borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: COLORS.teal,
  },
  fileName: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  optionCard: {
    flex: 1, minWidth: 90, backgroundColor: COLORS.bgCard, borderRadius: 18,
    padding: 18, alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border,
  },
  optionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  optionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  optionSub: { fontSize: 12, color: COLORS.textSecondary },
  infoCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  errorCard: { backgroundColor: COLORS.redDim, borderRadius: 12, padding: 14, marginBottom: 16 },
  errorText: { color: COLORS.red, fontSize: 13 },
  disclaimer: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 20, textAlign: 'center' },
  analyzeBtn: { borderRadius: 16, overflow: 'hidden' },
  analyzeBtnInner: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  analyzeBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  processingCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 24, padding: 32, margin: 24,
    alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border, width: '85%',
  },
  processingTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  processingMsg: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, textAlign: 'center' },
  processingSteps: { width: '100%' },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepText: { fontSize: 14, color: COLORS.textSecondary },
  processingDisclaimer: { fontSize: 12, color: COLORS.textMuted, marginTop: 16 },
});
