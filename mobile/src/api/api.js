import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getFallbackBaseUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'ios'
      ? 'http://localhost:4000/api'
      : 'http://10.0.2.2:4000/api';
  }
  return 'http://YOUR_BACKEND_IP:4000/api';
};

const resolveLocalNetworkHost = () => {
  try {
    const host =
      Constants?.expoGoConfig?.debuggerHost ??
      Constants?.expoConfig?.hostUri ??
      Constants?.manifest?.debuggerHost ??
      '';

    if (!host) return null;
    const hostAddress = host.split(':')[0];
    if (!hostAddress) return null;
    return `http://${hostAddress}:4000/api`;
  } catch (error) {
    console.warn('Error resolving local network host:', error);
    return null;
  }
};

const explicitEnvUrl = process.env.EXPO_PUBLIC_API_URL;
const dynamicLocalUrl = resolveLocalNetworkHost();
const API_BASE = explicitEnvUrl || dynamicLocalUrl || getFallbackBaseUrl();

if (__DEV__) {
  console.log(`[api] Using base URL: ${API_BASE}`);
}

let token = null;

export async function setToken(t) {
  token = t;
  if (t) await SecureStore.setItemAsync('userToken', t);
  else await SecureStore.deleteItemAsync('userToken');
}

export async function loadToken() {
  if (!token) token = await SecureStore.getItemAsync('userToken');
  return token;
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

client.interceptors.request.use(async (config) => {
  if (!config.headers) config.headers = {};
  const t = await loadToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default client;
