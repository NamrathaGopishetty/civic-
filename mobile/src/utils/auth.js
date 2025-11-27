import * as SecureStore from 'expo-secure-store';
import { setToken as setApiToken } from '../api/api';

export async function saveToken(token) {
  await SecureStore.setItemAsync('userToken', token);
  await setApiToken(token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync('userToken');
  await setApiToken(null);
}

export async function getToken() {
  return await SecureStore.getItemAsync('userToken');
}
