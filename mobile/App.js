import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageProvider } from './src/context/LanguageContext';
import { subscribeToIssueEvents } from './src/utils/realtime';

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
        payload.title || 'Issue update',
        payload.message || 'An update is available.'
      );
    });
    return unsubscribe;
  }, []);

  return (
    <LanguageProvider>
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
  );
}
