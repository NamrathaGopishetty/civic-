import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import MenuBar from '../components/MenuBar';
import { clearToken } from '../utils/auth';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const formatStatus = (status, t) => {
  if (!status) return '';
  const normalized = status.toLowerCase().replace(/\s+/g, '');
  switch (normalized) {
    case 'pending':
      return t('status.pending');
    case 'acknowledged':
      return t('status.acknowledged');
    case 'inprogress':
      return t('status.inProgress');
    case 'resolved':
      return t('status.resolved');
    default:
      return status;
  }
};

export default function MyIssuesScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      fetchIssues();
    }, [])
  );

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const resp = await api.get('/issues/my');
      setIssues(resp.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearToken();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={{flex:1, padding:16}}>
      <LanguageSwitcher />
      <MenuBar navigation={navigation} active="MyIssues" onLogout={handleLogout} />
      <Text style={{fontSize:20, marginBottom:8}}>{t('issues.myIssues')}</Text>
      <FlatList
        data={issues}
        keyExtractor={item => item._id || item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchIssues} />
        }
        renderItem={({item}) => (
          <TouchableOpacity onPress={()=>navigation.navigate('IssueDetail', { id: item._id || item.id })}>
            <View style={styles.card}>
              <Text style={{fontWeight:'bold'}}>{item.category} — {item.priority}</Text>
              <Text numberOfLines={1}>{item.description}</Text>
              <Text>{t('issues.status')}: {formatStatus(item.status, t)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card:{ padding:12, borderBottomWidth:1, borderColor:'#eee' }
});
