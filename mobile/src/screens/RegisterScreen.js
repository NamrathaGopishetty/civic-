import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable, ActivityIndicator, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import api from '../api/api';
import { saveToken } from '../utils/auth';
import { connectRealtime } from '../utils/realtime';
import { COLORS, SPACING, RADIUS } from '../theme';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BackgroundSlideshow from '../components/BackgroundSlideshow';

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
      navigation.replace('Report');
    } catch (err) {
      Alert.alert('Register Failed', err?.response?.data?.message || 'Check your details');
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

  const canSubmit = name && age && phone && emailValid && password && !loading;

  return (
    <BackgroundSlideshow>
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

          <View style={styles.glassCard}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoIcon}>🏛️</Text>
              </View>
              <Text style={styles.title}>Create Account</Text>
            </View>

            <TextInput
              label="Name" value={name} onChangeText={setName} mode="flat"
              left={<TextInput.Icon icon="account-outline" color="rgba(255,255,255,0.7)" />}
              style={styles.input}
              underlineColor="rgba(255,255,255,0.3)"
              activeUnderlineColor="rgba(255,255,255,0.9)"
              theme={inputTheme}
            />
            <View style={styles.row}>
              <TextInput
                label="Age" value={age} onChangeText={setAge} mode="flat"
                keyboardType="numeric" style={[styles.input, styles.half]}
                underlineColor="rgba(255,255,255,0.3)"
                activeUnderlineColor="rgba(255,255,255,0.9)"
                theme={inputTheme}
              />
              <TextInput
                label="Phone" value={phone} onChangeText={setPhone} mode="flat"
                keyboardType="phone-pad" style={[styles.input, styles.half]}
                left={<TextInput.Icon icon="phone-outline" color="rgba(255,255,255,0.7)" />}
                underlineColor="rgba(255,255,255,0.3)"
                activeUnderlineColor="rgba(255,255,255,0.9)"
                theme={inputTheme}
              />
            </View>

            <TextInput
              label="Email" value={email} onChangeText={setEmail}
              onBlur={() => setEmailTouched(true)}
              mode="flat" keyboardType="email-address" autoCapitalize="none"
              left={<TextInput.Icon icon="email-outline" color="rgba(255,255,255,0.7)" />}
              style={[styles.input, showEmailError && styles.inputError]}
              underlineColor={showEmailError ? '#FF5252' : 'rgba(255,255,255,0.3)'}
              activeUnderlineColor={showEmailError ? '#FF5252' : 'rgba(255,255,255,0.9)'}
              theme={inputTheme}
            />
            {showEmailError && (
              <Text style={styles.errorText}>Please enter a valid email address</Text>
            )}

            <TextInput
              label="Password" value={password} onChangeText={setPassword} mode="flat"
              secureTextEntry={secureEntry}
              left={<TextInput.Icon icon="lock-outline" color="rgba(255,255,255,0.7)" />}
              style={styles.input}
              underlineColor="rgba(255,255,255,0.3)"
              activeUnderlineColor="rgba(255,255,255,0.9)"
              theme={inputTheme}
            />
            <Pressable onPress={() => setSecureEntry(!secureEntry)} style={styles.eyeToggle}>
              <Text style={styles.eyeText}>
                {secureEntry ? '👁 Show' : '👁‍🗨 Hide'}
              </Text>
            </Pressable>

            <Pressable
              onPress={register}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.primaryBtn,
                !canSubmit && styles.primaryBtnDisabled,
                pressed && canSubmit && styles.primaryBtnPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primaryDark} size="small" />
              ) : (
                <Text style={styles.primaryBtnLabel}>Register</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={styles.textBtn}
            >
              <Text style={styles.textBtnLabel}>Already have an account? Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundSlideshow>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg, paddingVertical: SPACING.xxxl },
  langRow: { position: 'absolute', top: SPACING.xxxl, right: SPACING.lg, zIndex: 10 },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoIcon: { fontSize: 28 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center' },
  glassCard: {
    width: '100%', maxWidth: 420, alignSelf: 'center',
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
  row: { flexDirection: 'row', gap: SPACING.md },
  half: { flex: 1 },
  eyeToggle: { alignSelf: 'flex-end', marginBottom: SPACING.md, paddingVertical: 4 },
  eyeText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  primaryBtn: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADIUS.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  primaryBtnLabel: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  textBtn: { marginTop: SPACING.sm, alignItems: 'center', padding: SPACING.sm },
  textBtnLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
});
