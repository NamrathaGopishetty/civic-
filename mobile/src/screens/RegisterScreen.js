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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const showEmailError = emailTouched && email.length > 0 && !emailValid;

  const register = async () => {
    if (!name || !age || !phone || !email || !password) {
      return Alert.alert('Register', 'All fields are required.');
    }
    if (!emailValid) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    }
    const numericAge = Number(age);
    if (Number.isNaN(numericAge) || numericAge <= 0) {
      return Alert.alert('Invalid Age', 'Please enter a valid age.');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: name.trim(), age: numericAge, phone: phone.trim(),
        email: email.trim().toLowerCase(), password,
      });
      const loginResp = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      await saveToken(loginResp.data.token);
      if (loginResp.data?.user) connectRealtime(loginResp.data.user);
      navigation.replace('MyIssues');
    } catch (err) {
      Alert.alert('Register Failed', err?.response?.data?.message || 'Check your details');
    } finally {
      setLoading(false);
    }
  };

  const inputTheme = {
    colors: {
      text: '#0F172A',
      placeholder: '#94A3B8',
      label: '#64748B',
      primary: '#059669',
      background: '#F8FAFC',
    },
    roundness: 12,
  };

  const canSubmit = name && age && phone && emailValid && password && !loading;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
          bounces={false}
        >
          <View style={styles.langRow}>
            <LanguageSwitcher />
          </View>

          <View style={styles.heroHeader}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🌱</Text>
            </View>
            <Text style={styles.brandTitle}>Join Civic Connect</Text>
            <Text style={styles.brandTagline}>Empower Your Community</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Create Account 🚀</Text>
            <Text style={styles.formSub}>Start resolving issues in your neighborhood today.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  value={name} onChangeText={setName} mode="flat"
                  placeholder="Namratha Gopishetty"
                  style={styles.input}
                  underlineColor="transparent" activeUnderlineColor="transparent"
                  theme={inputTheme}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.half]}>
                <Text style={styles.formLabel}>Age</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={age} onChangeText={setAge} mode="flat"
                    keyboardType="numeric" placeholder="25"
                    style={styles.input}
                    underlineColor="transparent" activeUnderlineColor="transparent"
                    theme={inputTheme}
                  />
                </View>
              </View>
              <View style={[styles.formGroup, styles.half]}>
                <Text style={styles.formLabel}>Phone</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📱</Text>
                  <TextInput
                    value={phone} onChangeText={setPhone} mode="flat"
                    keyboardType="phone-pad" placeholder="9876543210"
                    style={styles.input}
                    underlineColor="transparent" activeUnderlineColor="transparent"
                    theme={inputTheme}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  value={email} onChangeText={setEmail}
                  onBlur={() => setEmailTouched(true)}
                  mode="flat" keyboardType="email-address" autoCapitalize="none"
                  placeholder="namratha@example.com"
                  style={[styles.input, showEmailError && { borderBottomColor: '#D32F2F' }]}
                  underlineColor="transparent" activeUnderlineColor="transparent"
                  theme={inputTheme}
                />
              </View>
              {showEmailError && (
                <Text style={styles.errorText}>Please enter a valid email address</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Create Password</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  value={password} onChangeText={setPassword} mode="flat"
                  secureTextEntry={secureEntry}
                  placeholder="At least 8 characters"
                  style={styles.input}
                  underlineColor="transparent" activeUnderlineColor="transparent"
                  theme={inputTheme}
                />
                <Pressable onPress={() => setSecureEntry(!secureEntry)}>
                  <Text style={styles.eyeIcon}>👁</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={register}
              disabled={!canSubmit}
              style={({ pressed }) => [
                pressed && canSubmit && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Citizen Account →</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.googleBtn}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Sign up with Google</Text>
            </Pressable>
          </View>

          <Text style={styles.bottomText}>
            Already registered?{' '}
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.bottomLink}>Sign In</Text>
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
    backgroundColor: '#ECFDF5',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logoEmoji: { fontSize: 26 },
  brandTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
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
  row: { flexDirection: 'row', gap: SPACING.md },
  half: { flex: 1 },
  formLabel: { fontSize: 11, fontWeight: '700', color: '#334155', marginBottom: 4 },
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
  bottomLink: { color: '#059669', fontWeight: '700' },
});
