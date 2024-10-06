import React, { createContext, useState, useContext } from 'react';
import translations from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    return savedLanguage;
  }
  
  const browserLanguage = navigator.language.split('-')[0];
  return browserLanguage === 'zh' ? 'zh' : 'en';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const initialLang = getInitialLanguage();
    localStorage.setItem('language', initialLang);
    return initialLang;
  });

  const value = { 
    language, 
    setLanguage: (lang) => {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }, 
    t: (key) => translations[language][key] 
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
