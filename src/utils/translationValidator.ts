/**
 * Translation Validation Utility
 * 
 * Validates translation completeness across all supported languages
 * and identifies missing translations or fallback keys
 */

import { translations, languages } from '../translations';
import { LanguageCode } from '../types/contexts/preferences';

export interface TranslationValidationResult {
  language: LanguageCode;
  languageName: string;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completionPercentage: number;
  fallbackKeys: string[];
}

export interface ValidationSummary {
  totalLanguages: number;
  results: TranslationValidationResult[];
  overallCompletionPercentage: number;
  languagesWithMissingTranslations: number;
}

/**
 * Get all translation keys from English (reference language)
 */
function getAllTranslationKeys(): string[] {
  const englishTranslations = translations.en;
  return Object.keys(englishTranslations);
}

/**
 * Validate translations for a specific language
 */
export function validateLanguageTranslations(languageCode: LanguageCode): TranslationValidationResult {
  const allKeys = getAllTranslationKeys();
  const languageTranslations = translations[languageCode];
  const language = languages.find(l => l.code === languageCode);
  
  const missingKeys: string[] = [];
  const fallbackKeys: string[] = [];
  
  allKeys.forEach(key => {
    const translation = languageTranslations?.[key];
    
    if (!translation) {
      missingKeys.push(key);
    } else if (translation === key) {
      // Translation is same as key (likely a fallback)
      fallbackKeys.push(key);
    }
  });
  
  const translatedKeys = allKeys.length - missingKeys.length;
  const completionPercentage = (translatedKeys / allKeys.length) * 100;
  
  return {
    language: languageCode,
    languageName: language?.nativeName || languageCode,
    totalKeys: allKeys.length,
    translatedKeys,
    missingKeys,
    completionPercentage: Math.round(completionPercentage * 100) / 100,
    fallbackKeys
  };
}

/**
 * Validate all language translations
 */
export function validateAllTranslations(): ValidationSummary {
  const results: TranslationValidationResult[] = [];
  
  languages.forEach(language => {
    const result = validateLanguageTranslations(language.code);
    results.push(result);
  });
  
  const totalTranslations = results.reduce((sum, r) => sum + r.translatedKeys, 0);
  const totalPossible = results.reduce((sum, r) => sum + r.totalKeys, 0);
  const overallCompletionPercentage = Math.round((totalTranslations / totalPossible) * 100 * 100) / 100;
  
  const languagesWithMissingTranslations = results.filter(r => r.missingKeys.length > 0).length;
  
  return {
    totalLanguages: languages.length,
    results,
    overallCompletionPercentage,
    languagesWithMissingTranslations
  };
}

/**
 * Get missing translations grouped by key
 */
export function getMissingTranslationsByKey(): Map<string, LanguageCode[]> {
  const missingByKey = new Map<string, LanguageCode[]>();
  
  languages.forEach(language => {
    const result = validateLanguageTranslations(language.code);
    
    result.missingKeys.forEach(key => {
      if (!missingByKey.has(key)) {
        missingByKey.set(key, []);
      }
      missingByKey.get(key)!.push(language.code);
    });
  });
  
  return missingByKey;
}

/**
 * Print validation report to console
 */
export function printValidationReport(): void {
  const summary = validateAllTranslations();
  
  console.group('🌐 Translation Validation Report');
  console.log(`Total Languages: ${summary.totalLanguages}`);
  console.log(`Overall Completion: ${summary.overallCompletionPercentage}%`);
  console.log(`Languages with Missing Translations: ${summary.languagesWithMissingTranslations}`);
  console.log('');
  
  summary.results.forEach(result => {
    const status = result.completionPercentage === 100 ? '✅' : '⚠️';
    console.group(`${status} ${result.languageName} (${result.language})`);
    console.log(`Completion: ${result.completionPercentage}%`);
    console.log(`Translated: ${result.translatedKeys}/${result.totalKeys}`);
    
    if (result.missingKeys.length > 0) {
      console.log(`Missing Keys (${result.missingKeys.length}):`);
      result.missingKeys.slice(0, 10).forEach(key => {
        console.log(`  - ${key}`);
      });
      if (result.missingKeys.length > 10) {
        console.log(`  ... and ${result.missingKeys.length - 10} more`);
      }
    }
    
    if (result.fallbackKeys.length > 0) {
      console.log(`Fallback Keys (${result.fallbackKeys.length}):`);
      result.fallbackKeys.slice(0, 5).forEach(key => {
        console.log(`  - ${key}`);
      });
      if (result.fallbackKeys.length > 5) {
        console.log(`  ... and ${result.fallbackKeys.length - 5} more`);
      }
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
}

/**
 * Export validation results as JSON
 */
export function exportValidationResults(): string {
  const summary = validateAllTranslations();
  return JSON.stringify(summary, null, 2);
}

/**
 * Check if a specific key is translated in all languages
 */
export function isKeyTranslatedInAllLanguages(key: string): boolean {
  return languages.every(language => {
    const translation = translations[language.code]?.[key];
    return translation && translation !== key;
  });
}

/**
 * Get translation coverage for specific keys
 */
export function getKeyCoverage(keys: string[]): Map<string, number> {
  const coverage = new Map<string, number>();
  
  keys.forEach(key => {
    let translatedCount = 0;
    
    languages.forEach(language => {
      const translation = translations[language.code]?.[key];
      if (translation && translation !== key) {
        translatedCount++;
      }
    });
    
    const percentage = (translatedCount / languages.length) * 100;
    coverage.set(key, Math.round(percentage * 100) / 100);
  });
  
  return coverage;
}

// Expose to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).translationValidator = {
    validateLanguage: validateLanguageTranslations,
    validateAll: validateAllTranslations,
    getMissingByKey: getMissingTranslationsByKey,
    printReport: printValidationReport,
    exportResults: exportValidationResults,
    isKeyTranslated: isKeyTranslatedInAllLanguages,
    getKeyCoverage
  };
}
