import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE44_APP_ID = process.env.EXPO_PUBLIC_BASE44_APP_ID || '';
const BASE44_FUNCTIONS_VERSION = process.env.EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION || 'prod';
const BASE44_APP_BASE_URL = process.env.EXPO_PUBLIC_BASE44_APP_BASE_URL || '';

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('base44_access_token');
  } catch {
    return null;
  }
};

export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem('base44_access_token', token);
  } catch {}
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem('base44_access_token');
  } catch {}
};

export const appParams = {
  appId: BASE44_APP_ID,
  functionsVersion: BASE44_FUNCTIONS_VERSION,
  appBaseUrl: BASE44_APP_BASE_URL,
};
