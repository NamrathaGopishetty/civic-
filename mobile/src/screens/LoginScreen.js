import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable, ActivityIndicator, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import api from '../api/api';
import { saveToken } from '../utils/auth';
import { connectRealtime } from '../utils/realtime';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../theme';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BackgroundSlideshow from '../components/BackgroundSlideshow';

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
      navigation.replace('Report');
    } catch (err) {
      Alert.alert('Login Failed', err?.response?.data?.message || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const inputTheme = {
    colors: {
      text: '#fff',
      placeholder: 'rgba(255,255,255,0.6)',
      label: 'rgba(255,255,255,0.7)',
      primary: 'rgba(255,255,255,0.9)',
    },
  };

  const showEmailError = emailTouched && email.length > 0 && !emailValid;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading && emailValid;

  return (
    <BackgroundSlideshow>
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

          <View style={styles.centerContent}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoIcon}>🏛️</Text>
              </View>
              <Text style={styles.appName}>Civic Connect</Text>
              <Text style={styles.tagline}>Report issues, track progress, build better cities</Text>
            </View>

            <View style={styles.glassCard}>
              <TextInput
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                onBlur={() => setEmailTouched(true)}
                mode="flat"
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email-outline" color="rgba(255,255,255,0.7)" />}
                style={[styles.input, showEmailError && styles.inputError]}
                underlineColor={showEmailError ? '#FF5252' : 'rgba(255,255,255,0.3)'}
                activeUnderlineColor={showEmailError ? '#FF5252' : 'rgba(255,255,255,0.9)'}
                theme={inputTheme}
              />
              {showEmailError && (
                <Text style={styles.errorText}>Please enter a valid email address</Text>
              )}

              <View>
                <TextInput
                  label={t('auth.password')}
                  value={password}
                  onChangeText={setPassword}
                  mode="flat"
                  secureTextEntry={secureEntry}
                  left={<TextInput.Icon icon="lock-outline" color="rgba(255,255,255,0.7)" />}
                  style={styles.input}
                  underlineColor="rgba(255,255,255,0.3)"
                  activeUnderlineColor="rgba(255,255,255,0.9)"
                  theme={inputTheme}
                />
              </View>
              <Pressable onPress={() => setSecureEntry(!secureEntry)} style={styles.eyeToggle}>
                <Text style={styles.eyeText}>
                  {secureEntry ? '👁 Show' : '👁‍🗨 Hide'}
                </Text>
              </Pressable>

              <Pressable
                onPress={login}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.loginBtn,
                  !canSubmit && styles.loginBtnDisabled,
                  pressed && canSubmit && styles.loginBtnPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.primaryDark} size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>{t('auth.login')}</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Register')}
                style={styles.registerBtn}
              >
                <Text style={styles.registerBtnText}>{t('auth.register')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundSlideshow>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  langRow: { position: 'absolute', top: SPACING.xxxl, right: SPACING.lg, zIndex: 10 },
  centerContent: { alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: SPACING.xs, textAlign: 'center' },
  glassCard: {
    width: '100%', maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  input: {
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.sm,
  },
  inputError: {
    backgroundColor: 'rgba(255,82,82,0.1)',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  eyeToggle: { alignSelf: 'flex-end', marginBottom: SPACING.md, paddingVertical: 4 },
  eyeText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  loginBtn: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADIUS.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  registerBtn: { marginTop: SPACING.md, alignItems: 'center', padding: SPACING.sm },
  registerBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
});
