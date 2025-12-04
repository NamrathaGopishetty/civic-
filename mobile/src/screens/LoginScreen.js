import React, {useState} from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import api from '../api/api';
import { saveToken } from '../utils/auth';
import { connectRealtime } from '../utils/realtime';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useLanguage();

  const login = async () => {
    try {
      const resp = await api.post('/auth/login', { email, password });
      await saveToken(resp.data.token);
      if (resp.data?.user) {
        connectRealtime(resp.data.user);
      }
      navigation.replace('Report');
    } catch (err) {
      console.warn(err);
      Alert.alert(t('auth.loginFailed'), err?.response?.data?.message || t('auth.checkCredentials'));
    }
  };

  return (
    <View style={styles.container}>
      <LanguageSwitcher />
      <Text style={styles.h1}>{t('auth.login')}</Text>
      <TextInput
        placeholder={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title={t('auth.login')} onPress={login} />
      <View style={{height:10}} />
      <Button title={t('auth.register')} onPress={() => navigation.navigate('Register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16, justifyContent:'center' },
  input:{ borderWidth:1, borderColor:'#ccc', padding:8, marginBottom:10, borderRadius:6 },
  h1:{ fontSize:24, marginBottom:16, textAlign:'center' }
});
