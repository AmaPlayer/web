/**
 * Language Validation Runner
 * 
 * Run this script to validate translation completeness
 * Usage: node -r ts-node/register src/utils/runLanguageValidation.ts
 */

import { validateAllTranslations, printValidationReport } from './translationValidator';

// Run validation
console.log('\n🌐 Running Translation Validation...\n');
printValidationReport();

// Export results
const summary = validateAllTranslations();
console.log('\n📊 Summary:');
console.log(`   Total Languages: ${summary.totalLanguages}`);
console.log(`   Overall Completion: ${summary.overallCompletionPercentage}%`);
console.log(`   Languages with Missing Translations: ${summary.languagesWithMissingTranslations}`);

// Check for critical missing translations
const criticalKeys = [
  'home', 'search', 'profile', 'messages', 'settings',
  'login', 'logout', 'signup', 'save', 'cancel', 'edit', 'delete'
];

console.log('\n🔍 Checking Critical Keys...');
summary.results.forEach(result => {
  const missingCritical = result.missingKeys.filter(key => criticalKeys.includes(key));
  if (missingCritical.length > 0) {
    console.log(`   ⚠️  ${result.languageName}: Missing ${missingCritical.length} critical keys`);
    missingCritical.forEach(key => console.log(`      - ${key}`));
  } else {
    console.log(`   ✅ ${result.languageName}: All critical keys present`);
  }
});

console.log('\n✨ Validation Complete!\n');
