import React, { createContext, useState, useContext, useEffect } from 'react';

// Import translations
import enTranslations from '../locales/en.json';
import zhTranslations from '../locales/zh.json';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });

  const [translations, setTranslations] = useState(language === 'zh' ? zhTranslations : enTranslations);

  useEffect(() => {
    localStorage.setItem('language', language);
    setTranslations(language === 'zh' ? zhTranslations : enTranslations);
  }, [language]);

  const t = (key) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
