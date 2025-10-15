import { useLanguage } from '../../contexts/LanguageContext';
import translations from '../translations';

const useTranslation = () => {
  const { currentLanguage } = useLanguage();
  
  const t = (key: string, fallback?: string): string => {
    // Split the key by dots to handle nested objects (e.g., 'home.welcome')
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    
    // Traverse the translations object to get the correct value
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        const enValue = keys.reduce((obj: any, k: string) => (obj && obj[k] !== 'undefined' ? obj[k] : ''), translations.en);
        return enValue || fallback || key; // Return the key as last resort
      }
    }
    
    return (typeof value === 'string' ? value : fallback) || key; // Return the key if no translation found
  };
  
  return { t, language: currentLanguage };
};

export default useTranslation;
