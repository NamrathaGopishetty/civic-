import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import en from './locales/en.json';
import hi from './locales/hi.json';

const i18n = new I18n({
  en,
  hi,
});

i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Initialize locale immediately (no async required)
let deviceLocale = 'en';
try {
  if (Localization.locale) {
    deviceLocale = Localization.locale.split('-')[0];
  }
} catch (error) {
  console.warn('Error getting device locale:', error);
}
i18n.locale = (deviceLocale === 'hi') ? 'hi' : 'en';

// Load saved preference if available
export const loadSavedLocale = async () => {
  try {
    const saved = await SecureStore.getItemAsync('app_language');
    if (saved && (saved === 'en' || saved === 'hi')) {
      i18n.locale = saved;
    }
  } catch (error) {
    console.warn('Error loading saved locale:', error);
  }
};

// Save user-selected language
export const setLocale = async (locale) => {
  try {
    i18n.locale = locale;
    await SecureStore.setItemAsync('app_language', locale);
  } catch (error) {
    console.warn('Error saving locale:', error);
  }
};

// Get active locale
export const getLocale = () => i18n.locale || 'en';

export default i18n;
