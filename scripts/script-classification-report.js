#!/usr/bin/env node

/**
 * Script Classification Report Generator
 * Analyzes and classifies all scripts in the web/scripts directory
 */

const fs = require('fs');
const path = require('path');

console.log('📊 SCRIPT CLASSIFICATION REPORT');
console.log('===============================');
console.log(`Generated: ${new Date().toISOString()}\n`);

// Script classification categories
const categories = {
  OBSOLETE_DEBUG: 'Obsolete Debug/Fix Scripts',
  OBSOLETE_TEST: 'Obsolete Test Files',
  ESSENTIAL_SETUP: 'Essential Setup Scripts',
  ESSENTIAL_MIGRATION: 'Essential Migration Scripts', 
  ESSENTIAL_DEPLOYMENT: 'Essential Deployment Scripts',
  REVIEW_NEEDED: 'Scripts Requiring Review',
  ALREADY_ORGANIZED: 'Already Organized Scripts'
};

// Classification rules based on naming patterns and content analysis
const classificationRules = [
  // Obsolete scripts - debug and fix patterns
  { pattern: /^debug-/, category: categories.OBSOLETE_DEBUG, reason: 'Debug script - temporary troubleshooting tool' },
  { pattern: /^fix-/, category: categories.OBSOLETE_DEBUG, reason: 'One-time fix script - no longer needed' },
  
  // Obsolete test files
  { pattern: /\.html$/, category: categories.OBSOLETE_TEST, reason: 'HTML test file - not a script' },
  { pattern: /^test-.*\.html$/, category: categories.OBSOLETE_TEST, reason: 'HTML test file - not a script' },
  
  // Essential setup scripts
  { pattern: /^setup-/, category: categories.ESSENTIAL_SETUP, reason: 'Setup script for database/environment configuration' },
  { pattern: /^seed-/, category: categories.ESSENTIAL_SETUP, reason: 'Data seeding script for development/testing' },
  
  // Essential migration scripts
  { pattern: /^migrate-/, category: categories.ESSENTIAL_MIGRATION, reason: 'Database migration script' },
  
  // Essential deployment scripts
  { pattern: /^deploy-/, category: categories.ESSENTIAL_DEPLOYMENT, reason: 'Deployment script for production' },
  { pattern: /^apply-.*rules/, category: categories.ESSENTIAL_DEPLOYMENT, reason: 'Security rules deployment script' },
  
  // Test scripts that might be useful
  { pattern: /^test-.*\.js$/, category: categories.REVIEW_NEEDED, reason: 'Test script - review for CI/CD usefulness' }
];

function classifyScript(filename) {
  // Check if already in organized directories
  if (filename.includes('/deployment/') || filename.includes('/migrations/')) {
    return {
      category: categories.ALREADY_ORGANIZED,
      reason: 'Already organized in appropriate subdirectory',
      shouldKeep: true,
      newLocation: null
    };
  }

  // Apply classification rules
  for (const rule of classificationRules) {
    if (rule.pattern.test(filename)) {
      const shouldKeep = rule.category !== categories.OBSOLETE_DEBUG && 
                        rule.category !== categories.OBSOLETE_TEST;
      
      let newLocation = null;
      if (shouldKeep) {
        if (rule.category === categories.ESSENTIAL_SETUP) {
          newLocation = 'setup/';
        } else if (rule.category === categories.ESSENTIAL_MIGRATION) {
          newLocation = 'migrations/';
        } else if (rule.category === categories.ESSENTIAL_DEPLOYMENT) {
          newLocation = 'deployment/';
        }
      }
      
      return {
        category: rule.category,
        reason: rule.reason,
        shouldKeep,
        newLocation
      };
    }
  }

  // Default classification for unmatched scripts
  return {
    category: categories.REVIEW_NEEDED,
    reason: 'Requires manual review to determine purpose and necessity',
    shouldKeep: true,
    newLocation: null
  };
}

function analyzeScriptContent(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const analysis = {
      hasTemporaryMarkers: /TODO|FIXME|TEMP|DEBUG|HACK/i.test(content),
      hasOneTimeSetup: /one.?time|initial.?setup|first.?run/i.test(content),
      hasProductionCode: /production|deploy|live/i.test(content),
      hasTestCode: /test|spec|mock/i.test(content),
      linesOfCode: content.split('\n').length
    };
    return analysis;
  } catch (error) {
    return { error: error.message };
  }
}

function scanDirectory(dirPath, baseDir = '') {
  const scripts = [];
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(baseDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      scripts.push(...scanDirectory(fullPath, relativePath));
    } else if (stat.isFile()) {
      // Analyze file
      const classification = classifyScript(relativePath);
      const contentAnalysis = analyzeScriptContent(fullPath);
      
      scripts.push({
        filename: item,
        relativePath,
        fullPath,
        size: stat.size,
        modified: stat.mtime,
        classification,
        contentAnalysis
      });
    }
  }
  
  return scripts;
}

// Main analysis
const scriptsDir = path.join(__dirname);
const allScripts = scanDirectory(scriptsDir);

// Group scripts by category
const scriptsByCategory = {};
Object.values(categories).forEach(category => {
  scriptsByCategory[category] = [];
});

allScripts.forEach(script => {
  const category = script.classification.category;
  scriptsByCategory[category].push(script);
});

// Generate report
console.log('📈 SUMMARY STATISTICS');
console.log('====================');
console.log(`Total scripts analyzed: ${allScripts.length}`);
console.log(`Scripts to remove: ${scriptsByCategory[categories.OBSOLETE_DEBUG].length + scriptsByCategory[categories.OBSOLETE_TEST].length}`);
console.log(`Scripts to keep: ${allScripts.length - (scriptsByCategory[categories.OBSOLETE_DEBUG].length + scriptsByCategory[categories.OBSOLETE_TEST].length)}`);
console.log(`Scripts needing review: ${scriptsByCategory[categories.REVIEW_NEEDED].length}\n`);

// Detailed breakdown by category
Object.entries(scriptsByCategory).forEach(([category, scripts]) => {
  if (scripts.length === 0) return;
  
  console.log(`\n📂 ${category.toUpperCase()}`);
  console.log('='.repeat(category.length + 4));
  console.log(`Count: ${scripts.length}\n`);
  
  scripts.forEach(script => {
    console.log(`📄 ${script.relativePath}`);
    console.log(`   Size: ${(script.size / 1024).toFixed(1)}KB | Modified: ${script.modified.toLocaleDateString()}`);
    console.log(`   Reason: ${script.classification.reason}`);
    
    if (script.classification.shouldKeep && script.classification.newLocation) {
      console.log(`   → Move to: ${script.classification.newLocation}`);
    } else if (!script.classification.shouldKeep) {
      console.log(`   → Action: DELETE`);
    }
    
    if (script.contentAnalysis.hasTemporaryMarkers) {
      console.log(`   ⚠️  Contains temporary markers (TODO/FIXME/DEBUG)`);
    }
    
    console.log('');
  });
});

// Recommendations
console.log('\n🎯 RECOMMENDATIONS');
console.log('==================');

const toRemove = [...scriptsByCategory[categories.OBSOLETE_DEBUG], ...scriptsByCategory[categories.OBSOLETE_TEST]];
const toOrganize = [...scriptsByCategory[categories.ESSENTIAL_SETUP], ...scriptsByCategory[categories.ESSENTIAL_MIGRATION], ...scriptsByCategory[categories.ESSENTIAL_DEPLOYMENT]];

console.log('\n1. IMMEDIATE REMOVAL (Safe to delete):');
toRemove.forEach(script => {
  console.log(`   ❌ ${script.relativePath} - ${script.classification.reason}`);
});

console.log('\n2. ORGANIZE INTO SUBDIRECTORIES:');
toOrganize.forEach(script => {
  if (script.classification.newLocation) {
    console.log(`   📁 ${script.relativePath} → ${script.classification.newLocation}`);
  }
});

console.log('\n3. MANUAL REVIEW REQUIRED:');
scriptsByCategory[categories.REVIEW_NEEDED].forEach(script => {
  console.log(`   🔍 ${script.relativePath} - ${script.classification.reason}`);
});

console.log('\n4. ALREADY ORGANIZED:');
scriptsByCategory[categories.ALREADY_ORGANIZED].forEach(script => {
  console.log(`   ✅ ${script.relativePath} - ${script.classification.reason}`);
});

// Generate JSON report for programmatic use
const reportData = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalScripts: allScripts.length,
    toRemove: toRemove.length,
    toKeep: allScripts.length - toRemove.length,
    needsReview: scriptsByCategory[categories.REVIEW_NEEDED].length
  },
  scripts: allScripts,
  recommendations: {
    remove: toRemove.map(s => s.relativePath),
    organize: toOrganize.filter(s => s.classification.newLocation).map(s => ({
      from: s.relativePath,
      to: s.classification.newLocation
    })),
    review: scriptsByCategory[categories.REVIEW_NEEDED].map(s => s.relativePath)
  }
};

const reportPath = path.join(__dirname, 'classification-report.json');
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

console.log(`\n💾 Detailed report saved to: ${reportPath}`);
console.log('\n✨ Classification complete! Ready for cleanup phase.');