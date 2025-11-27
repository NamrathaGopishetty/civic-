import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function MenuBar({ navigation, active, onLogout }) {
  const { t } = useLanguage();

  const handleNavigate = (screen) => {
    if (active === screen) return;
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, active === 'Report' && styles.activeTab]}
        onPress={() => handleNavigate('Report')}
      >
        <Text style={[styles.tabText, active === 'Report' && styles.activeTabText]}>
          {t('report.title')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, active === 'MyIssues' && styles.activeTab]}
        onPress={() => handleNavigate('MyIssues')}
      >
        <Text style={[styles.tabText, active === 'MyIssues' && styles.activeTabText]}>
          {t('issues.myIssues')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutTab} onPress={onLogout}>
        <Text style={styles.logoutText}>{t('common.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#1f8ef1',
  },
  tabText: {
    fontWeight: '600',
    color: '#1f1f1f',
  },
  activeTabText: {
    color: '#fff',
  },
  logoutTab: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginLeft: 6,
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
});

