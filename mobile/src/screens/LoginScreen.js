import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable, ActivityIndicator, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/api';
import { saveToken } from '../utils/auth';
import { connectRealtime } from '../utils/realtime';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../theme';
import LanguageSwitcher from '../components/LanguageSwitcher';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const { t } = useLanguage();

  const emailValid = EMAIL_REGEX.test(email.trim());

  const login = async () => {
    if (!email.trim() || !password) return;
    if (!emailValid) {
      Alert.alert(t('auth.loginFailed'), 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const resp = await api.post('/auth/login', { email: email.trim(), password });
      await saveToken(resp.data.token);
      if (resp.data?.user) connectRealtime(resp.data.user);
      navigation.replace('MyIssues');
    } catch (err) {
      Alert.alert('Login Failed', err?.response?.data?.message || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const inputTheme = {
    colors: {
      text: '#0F172A',
      placeholder: '#94A3B8',
      label: '#64748B',
      primary: '#0284C7',
      background: '#F8FAFC',
    },
    roundness: 12,
  };

  const showEmailError = emailTouched && email.length > 0 && !emailValid;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading && emailValid;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.langRow}>
            <LanguageSwitcher />
          </View>

          <View style={styles.heroHeader}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🏛️</Text>
            </View>
            <Text style={styles.brandTitle}>Civic Connect</Text>
            <Text style={styles.brandTagline}>Your Voice • Your City</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Welcome Back 👋</Text>
            <Text style={styles.formSub}>Sign in to report and track municipal issues.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setEmailTouched(true)}
                  mode="flat"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="namratha@example.com"
                  style={styles.input}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  theme={inputTheme}
                />
              </View>
              {showEmailError && (
                <Text style={styles.errorText}>Please enter a valid email address</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.formLabel}>Password</Text>
                <Pressable>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </Pressable>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  mode="flat"
                  secureTextEntry={secureEntry}
                  placeholder="••••••••••••"
                  style={styles.input}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  theme={inputTheme}
                />
                <Pressable onPress={() => setSecureEntry(!secureEntry)}>
                  <Text style={styles.eyeIcon}>👁</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={login}
              disabled={!canSubmit}
              style={({ pressed }) => [
                pressed && canSubmit && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={['#0E7490', '#0369A1']}
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Sign In →</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.googleBtn}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </Pressable>
          </View>

          <Text style={styles.bottomText}>
            Don't have an account?{' '}
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.bottomLink}>Create Account</Text>
            </Pressable>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingVertical: SPACING.xxxl, paddingHorizontal: SPACING.lg },
  langRow: { position: 'absolute', top: SPACING.xxxl, right: SPACING.lg, zIndex: 10 },
  heroHeader: {
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logoEmoji: { fontSize: 26 },
  brandTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.lg,
  },
  formHeading: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4, marginBottom: 2 },
  formSub: { fontSize: 12, color: '#64748B', marginBottom: SPACING.lg },
  formGroup: { marginBottom: SPACING.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  formLabel: { fontSize: 11, fontWeight: '700', color: '#334155' },
  forgotLink: { fontSize: 11, color: '#0284C7', fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 13,
    minHeight: 0,
    height: 46,
  },
  eyeIcon: { fontSize: 14, opacity: 0.5, paddingLeft: 8 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4, marginLeft: 4 },
  submitBtn: {
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  googleBtn: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  googleIcon: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  bottomText: { textAlign: 'center', fontSize: 12, color: '#64748B' },
  bottomLink: { color: '#0284C7', fontWeight: '700' },
});
