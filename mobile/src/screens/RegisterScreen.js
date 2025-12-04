import React, {useState} from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import api from '../api/api';
import { saveToken } from '../utils/auth';
import { connectRealtime } from '../utils/realtime';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useLanguage();

  const register = async () => {
    if (!name || !age || !phone || !email || !password) {
      return Alert.alert(t('auth.register'), t('auth.allFieldsRequired'));
    }
    const numericAge = Number(age);
    if (Number.isNaN(numericAge) || numericAge <= 0) {
      return Alert.alert(t('auth.invalidAgeTitle'), t('auth.invalidAgeMessage'));
    }
    const payload = {
      name: name.trim(),
      age: numericAge,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    try {
      await api.post('/auth/register', payload);
      const loginResp = await api.post('/auth/login', { email: payload.email, password });
      await saveToken(loginResp.data.token);
      if (loginResp.data?.user) {
        connectRealtime(loginResp.data.user);
      }
      navigation.replace('Report');
    } catch (err) {
      console.warn(err);
      Alert.alert(t('auth.registerFailed'), err?.response?.data?.message || t('auth.checkCredentials'));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LanguageSwitcher />
      <Text style={styles.h1}>{t('auth.register')}</Text>
      <TextInput placeholder={t('auth.name')} value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder={t('auth.age')} value={age} onChangeText={setAge} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
      <TextInput placeholder={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.input} autoCapitalize="none" />
      <TextInput placeholder={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title={t('auth.register')} onPress={register} />
      <View style={{height:10}}/>
      <Button title={t('auth.haveAccount')} onPress={() => navigation.navigate('Login')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, flexGrow:1, justifyContent:'center' },
  input:{ borderWidth:1, borderColor:'#ccc', padding:8, marginBottom:10, borderRadius:6 },
  h1:{ fontSize:24, marginBottom:16, textAlign:'center' }
});
