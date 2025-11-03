/**
 * Quick translation validation script
 * Run with: node web/test-translations.js
 */

const fs = require('fs');
const path = require('path');

// Read the translations file
const translationsPath = path.join(__dirname, 'src', 'translations', 'index.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

// Extract language codes
const languages = ['en', 'hi', 'pa', 'mr', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'or', 'as'];

// Get English keys (reference)
const enMatch = content.match(/en:\s*{([^}]+(?:{[^}]*}[^}]*)*)/s);
if (!enMatch) {
  console.error('Could not find English translations');
  process.exit(1);
}

// Count keys for each language
console.log('\n🌐 Translation Validation Report\n');
console.log('='.repeat(60));

const enKeys = (enMatch[0].match(/\w+:/g) || []).length;
console.log(`\nEnglish (Reference): ${enKeys} keys\n`);

languages.forEach(lang => {
  if (lang === 'en') return;
  
  const langRegex = new RegExp(`${lang}:\\s*{([^}]+(?:{[^}]*}[^}]*)*)`, 's');
  const langMatch = content.match(langRegex);
  
  if (langMatch) {
    const langKeys = (langMatch[0].match(/\w+:/g) || []).length;
    const percentage = ((langKeys / enKeys) * 100).toFixed(1);
    const status = percentage === '100.0' ? '✅' : percentage > 50 ? '⚠️' : '❌';
    
    console.log(`${status} ${lang.toUpperCase()}: ${langKeys}/${enKeys} keys (${percentage}%)`);
  } else {
    console.log(`❌ ${lang.toUpperCase()}: Not found`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n✨ Validation complete!\n');
console.log('For detailed analysis, run the app and use:');
console.log('  window.translationValidator.printReport()\n');
