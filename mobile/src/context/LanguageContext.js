import React, { createContext, useState, useEffect, useContext } from 'react';
import i18n, { setLocale, getLocale, loadSavedLocale } from '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(getLocale());

  useEffect(() => {
    const initLocale = async () => {
      await loadSavedLocale();
      setLocaleState(getLocale());
    };
    initLocale();
  }, []);

  const changeLanguage = async (newLocale) => {
    await setLocale(newLocale);
    setLocaleState(newLocale);
  };

  // Provide a safe translation function
  const t = (key, options) => {
    try {
      return i18n.t(key, options);
    } catch (error) {
      console.warn('Translation error:', error, 'for key:', key);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};


