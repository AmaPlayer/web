import { useLanguage } from '../../contexts/UnifiedPreferencesContext';

const useTranslation = () => {
  const { currentLanguage, t } = useLanguage();
  
  return { t, language: currentLanguage };
};

export default useTranslation;
