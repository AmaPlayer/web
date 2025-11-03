import React, { useState, useRef, useEffect, memo } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../../contexts/UnifiedPreferencesContext';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  inline?: boolean;
  showLabel?: boolean;
  dropdownPosition?: 'left' | 'right';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = memo(function LanguageSelector({ 
  inline = false, 
  showLabel = false,
  dropdownPosition = 'right'
}) {
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode as any);
    setIsOpen(false);
  };

  const getCurrentLanguageName = (): string => {
    const language = languages.find(lang => lang.code === currentLanguage);
    return language ? language.name : 'English';
  };

  return (
    <div 
      className={`language-selector ${inline ? 'language-selector-inline' : ''}`} 
      ref={dropdownRef}
    >
      <button 
        className={`language-toggle ${inline ? 'language-toggle-inline' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={inline ? 18 : 20} className="language-icon" />
        {showLabel && (
          <span className="language-label">
            {getCurrentLanguageName()}
          </span>
        )}
        {inline && <ChevronDown size={16} className={`language-arrow ${isOpen ? 'open' : ''}`} />}
      </button>
      
      {isOpen && (
        <div className={`language-dropdown language-dropdown-${dropdownPosition}`}>
          <div className="language-dropdown-header">
            <Globe size={16} />
            <span>Choose Language</span>
          </div>
          <div className="language-options">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`language-option ${currentLanguage === language.code ? 'active' : ''}`}
                onClick={() => handleLanguageChange(language.code)}
                role="menuitem"
                tabIndex={0}
              >
                <div className="language-info">
                  <span className="language-name">{language.name}</span>
                  <span className="language-native">{language.nativeName}</span>
                </div>
                {currentLanguage === language.code && (
                  <span className="language-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default LanguageSelector;
