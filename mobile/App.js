import React, { useEffect } from 'react';
import { Alert, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { LanguageProvider } from './src/context/LanguageContext';
import { subscribeToIssueEvents } from './src/utils/realtime';
import { THEME, COLORS } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ReportScreen from './src/screens/ReportScreen';
import MyIssuesScreen from './src/screens/MyIssuesScreen';
import IssueDetailScreen from './src/screens/IssueDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const unsubscribe = subscribeToIssueEvents((payload) => {
      if (!payload) return;
      Alert.alert(
        payload.title || 'Issue Update',
        payload.message || 'An update is available.'
      );
    });
    return unsubscribe;
  }, []);

  return (
    <PaperProvider theme={THEME}>
      <LanguageProvider>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
            <Stack.Screen name="MyIssues" component={MyIssuesScreen} />
            <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </PaperProvider>
  );
}
