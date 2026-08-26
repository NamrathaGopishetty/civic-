import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';

export default function FloatingTabBar({ navigation, active }) {
  const tabs = [
    { key: 'MyIssues', label: 'Home', icon: '🏠' },
    { key: 'add', label: '', icon: '+' },
    { key: 'Report', label: 'Reports', icon: '📋' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          if (tab.key === 'add') {
            return (
              <Pressable
                key={tab.key}
                style={styles.addBtnWrapper}
                onPress={() => navigation.navigate('Report')}
              >
                <LinearGradient
                  colors={['#0284C7', '#0E7490']}
                  style={styles.addBtn}
                >
                  <Text style={styles.addBtnIcon}>+</Text>
                </LinearGradient>
              </Pressable>
            );
          }

          const isActive = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.key)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 14,
    left: 18,
    right: 18,
    zIndex: 100,
  },
  tabBar: {
    height: 56,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    ...SHADOWS.lg,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  addBtnWrapper: {
    alignItems: 'center',
    marginTop: -6,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  addBtnIcon: {
    fontSize: 22,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});
