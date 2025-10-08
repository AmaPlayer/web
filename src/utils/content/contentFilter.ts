// Content Filtering System for AmaPlayer
// Filters inappropriate content in posts, messages, and media

// Comprehensive filter categories
const FILTER_CATEGORIES = {
  POLITICS: 'politics',
  NUDITY: 'nudity', 
  VIOLENCE: 'violence',
  HATE_SPEECH: 'hate_speech',
  SPAM: 'spam',
  DRUGS: 'drugs'
};

// Severity levels for violations
const SEVERITY_LEVELS = {
  LOW: 'low',        // Warning only
  MEDIUM: 'medium',  // Block with explanation
  HIGH: 'high',      // Block and flag for review
  CRITICAL: 'critical' // Block, flag, and potential account action
};

// Filter word lists by category
const FILTER_WORDS = {
  [FILTER_CATEGORIES.POLITICS]: {
    english: [
      'BJP', 'Congress', 'AAP', 'Modi', 'Rahul Gandhi', 'politician', 'election',
      'vote', 'party', 'government', 'minister', 'parliament', 'democracy',
      'constitution', 'political', 'campaign', 'rally', 'manifesto', 'ballot',
      'corrupt', 'scam', 'bribe', 'reservation', 'caste', 'religion politics',
      'Hindu', 'Muslim', 'Christian', 'Sikh', 'Hindu rashtra', 'secularism',
      'communal', 'riots', 'protest', 'strike', 'bandh', 'hartal'
    ],
    hindi: [
      'राजनीति', 'नेता', 'सरकार', 'चुनाव', 'वोट', 'पार्टी', 'मंत्री',
      'संसद', 'भ्रष्टाचार', 'घोटाला', 'आरक्षण', 'जाति', 'धर्म', 'दंगा',
      'प्रदर्शन', 'हड़ताल', 'बंद'
    ],
    severity: SEVERITY_LEVELS.MEDIUM
  },

  [FILTER_CATEGORIES.NUDITY]: {
    english: [
      'nude', 'naked', 'sex', 'porn', 'xxx', 'adult', 'explicit', 'nsfw',
      'breast', 'nipple', 'penis', 'vagina', 'masturbate', 'orgasm', 'erotic',
      'seductive', 'strip', 'bikini', 'underwear', 'lingerie', 'intimate',
      'sexual', 'seduce', 'horny', 'arousal', 'pleasure', 'escort', 'prostitute',
      'fuck', 'fucking', 'shit', 'bitch', 'ass', 'pussy', 'dick', 'cock',
      'tits', 'boobs', 'butt', 'sexy', 'hot girl', 'hot guy', 'hookup', 
      'one night', 'nudes', 'cum', 'sperm', 'ejaculate', 'climax'
    ],
    hindi: [
      'नंगा', 'अश्लील', 'यौन', 'गंदा', 'वेश्या', 'कामुक', 'उत्तेजक',
      'रंडी', 'भोसड़ी', 'चूत', 'लौड़ा', 'लंड', 'गांड', 'चूतिया'
    ],
    severity: SEVERITY_LEVELS.CRITICAL
  },

  [FILTER_CATEGORIES.VIOLENCE]: {
    english: [
      'kill', 'murder', 'death', 'blood', 'gore', 'violence', 'fight', 'beat',
      'weapon', 'gun', 'knife', 'sword', 'bomb', 'explosive', 'terrorist',
      'attack', 'assault', 'abuse', 'torture', 'hurt', 'pain', 'wound',
      'injury', 'brutal', 'savage', 'cruel', 'threatening', 'revenge',
      'destroy', 'harm', 'damage', 'shoot', 'stab', 'punch', 'kick',
      'die', 'dead', 'corpse', 'slaughter', 'massacre', 'execution', 'poison',
      'suicide', 'self harm', 'cutting', 'bleeding', 'wound', 'scar'
    ],
    hindi: [
      'मार', 'हत्या', 'खून', 'हिंसा', 'लड़ाई', 'मारपीट', 'हथियार',
      'बंदूक', 'चाकू', 'बम', 'आतंकवादी', 'हमला', 'दुर्व्यवहार', 'यातना',
      'दर्द', 'घाव', 'क्रूर', 'धमकी', 'बदला', 'नष्ट', 'नुकसान',
      'मरना', 'मृत', 'लाश', 'हत्या', 'जहर', 'आत्महत्या'
    ],
    severity: SEVERITY_LEVELS.HIGH
  },

  [FILTER_CATEGORIES.HATE_SPEECH]: {
    english: [
      'hate', 'racist', 'discrimination', 'bigot', 'prejudice', 'inferior',
      'superior', 'slur', 'offensive', 'derogatory', 'insult', 'mock',
      'ridicule', 'shame', 'humiliate', 'bully', 'harassment', 'threat',
      'stupid', 'idiot', 'fool', 'worthless', 'disgusting',
      'pathetic', 'ugly', 'fat', 'skinny', 'short', 'tall', 'dark', 'fair',
      'retard', 'gay', 'lesbian', 'trans', 'faggot', 'nigger', 'chink',
      'paki', 'terrorist', 'backward', 'primitive', 'savage', 'barbaric'
    ],
    hindi: [
      'नफरत', 'भेदभाव', 'जातिवाद', 'अपमान', 'मूर्ख', 'बेवकूफ', 'गंदा',
      'बदसूरत', 'मोटा', 'पतला', 'छोटा', 'काला', 'गोरा', 'धमकी',
      'परेशान', 'तंग', 'कुत्ता', 'सुअर', 'हरामी', 'कमीना', 'गधा'
    ],
    severity: SEVERITY_LEVELS.HIGH
  },

  [FILTER_CATEGORIES.SPAM]: {
    english: [
      'buy now', 'click here', 'free money', 'earn money', 'get rich quick',
      'investment', 'scheme', 'lottery', 
      'offer', 'discount', 'sale', 'cheap', 'deal', 'promotion', 'advertise',
      'marketing', 'business opportunity', 'work from home', 'easy money',
      'guaranteed', 'limited time', 'urgent', 'act now'
    ],
    hindi: [
      'पैसा कमाओ', 'मुफ्त पैसा', 'लॉटरी', 'इनाम', 'ऑफर', 'छूट', 'सेल',
      'व्यापार', 'घर से काम', 'आसान पैसा', 'गारंटी', 'जल्दी करें'
    ],
    severity: SEVERITY_LEVELS.MEDIUM
  },

  [FILTER_CATEGORIES.DRUGS]: {
    english: [
      'drugs', 'cocaine', 'heroin', 'marijuana', 'weed', 'cannabis', 'hash',
      'ecstasy', 'meth', 'alcohol', 'wine', 'whiskey', 'vodka',
      'drunk', 'intoxicated', 'high', 'stoned', 'dealer',
      'substance abuse', 'overdose', 'pills', 'tablets', 'injection'
    ],
    hindi: [
      'नशा', 'शराब', 'वाइन', 'व्हिस्की', 'वोडका', 'नशेड़ी',
      'गांजा', 'चरस', 'अफीम', 'हेरोइन', 'कोकीन', 'गोलियां', 'इंजेक्शन'
    ],
    severity: SEVERITY_LEVELS.HIGH
  }
};

// Additional context-based patterns
const CONTEXT_PATTERNS = [
  // Political discussion patterns
  {
    pattern: /(bjp|congress|aap).*(bad|good|vote|support)/i,
    category: FILTER_CATEGORIES.POLITICS,
    severity: SEVERITY_LEVELS.MEDIUM
  },
  // Sexual content patterns  
  {
    pattern: /(want|need|looking).*(sex|hookup|adult fun)/i,
    category: FILTER_CATEGORIES.NUDITY,
    severity: SEVERITY_LEVELS.CRITICAL
  },
  // Violence threat patterns
  {
    pattern: /(will|gonna|going to).*(kill|hurt|beat|destroy)/i,
    category: FILTER_CATEGORIES.VIOLENCE,
    severity: SEVERITY_LEVELS.HIGH
  },
  // Spam patterns
  {
    pattern: /(earn|make).*(\$|₹|money|rupees).*(easy|quick|fast)/i,
    category: FILTER_CATEGORIES.SPAM,
    severity: SEVERITY_LEVELS.MEDIUM
  }
];

// Sports slang and athlete-friendly terms that should NOT be filtered
const SPORTS_WHITELIST = {
  english: [
    // Performance terms that might trigger filters but are sports-related
    'fire', 'lit', 'sick', 'insane', 'crazy', 'mad', 'killer', 'beast', 'monster',
    'crush', 'destroy', 'annihilate', 'murder', 'kill it', 'slay', 'dominate',
    'explosive', 'bomb', 'rocket', 'bullet', 'shot', 'blast', 'rip', 'tear',
    // Congratulatory terms
    'congrats', 'congratulations', 'props', 'respect', 'salute', 'bow down',
    // Intensity terms
    'intense', 'brutal workout', 'savage training', 'beast mode', 'go hard',
    'push limits', 'break barriers', 'smash records', 'destroy competition',
    // Common athlete slang
    'gains', 'swole', 'jacked', 'ripped', 'shredded', 'cut', 'bulk', 'lean',
    'grind', 'hustle', 'work', 'pump', 'rep', 'set', 'max out', 'PR',
    // Competition terms
    'opponent', 'rival', 'enemy', 'target', 'hunt', 'prey', 'victim',
    'conquer', 'defeat', 'victory', 'triumph', 'champion', 'winner'
  ],
  hindi: [
    'बधाई', 'शाबाश', 'वाह', 'जबरदस्त', 'कमाल', 'धमाका', 'तूफान',
    'आग', 'जोश', 'जुनून', 'हौसला', 'दम', 'ताकत', 'शक्ति'
  ]
};

// Helper function to check if text contains sports whitelist terms
const checkSportsWhitelist = (text, languages) => {
  for (const language of languages) {
    if (SPORTS_WHITELIST[language]) {
      const terms = SPORTS_WHITELIST[language];
      for (const term of terms) {
        if (text.includes(term.toLowerCase())) {
          return true;
        }
      }
    }
  }
  return false;
};

// Helper function to check if a specific word is in sports whitelist
const isSportsWhitelistWord = (word, language) => {
  if (!SPORTS_WHITELIST[language]) return false;
  
  return SPORTS_WHITELIST[language].some(whitelistTerm => {
    const term = whitelistTerm.toLowerCase();
    // Check exact match or if the word is part of a whitelisted phrase
    return term === word || term.includes(word) || word.includes(term);
  });
};

// Content filter options interface
interface ContentFilterOptions {
  strictMode?: boolean;
  checkPatterns?: boolean;
  languages?: string[];
  context?: 'general' | 'talent_showcase' | 'sports_post';
}

// Main content filtering function
export const filterContent = (text: string, options: ContentFilterOptions = {}) => {
  const {
    strictMode = false,
    checkPatterns = true,
    languages = ['english', 'hindi'],
    context = 'general' // 'general', 'talent_showcase', 'sports_post'
  } = options;

  const violations = [];
  const cleanText = text.toLowerCase().trim();
  
  console.log(`🔍 Content Filter Debug: Checking "${text}" with context: ${context}`);
  
  if (!cleanText) return { isClean: true, violations: [] };

  // Check if text contains sports-friendly terms that should be whitelisted
  const isSportsContext = context === 'talent_showcase' || context === 'sports_post';

  // Check direct word matches
  for (const [category, data] of Object.entries(FILTER_WORDS)) {
    for (const language of languages) {
      if (data[language]) {
        const words = data[language];
        
        for (const word of words) {
          // Use word boundaries for most words, but allow partial matching for some
          const needsWordBoundary = word.length > 3 && !word.includes(' ');
          const regex = (strictMode && needsWordBoundary)
            ? new RegExp(`\\b${word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
            : new RegExp(word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            
          if (regex.test(cleanText)) {
            // Check if this word should be whitelisted in sports context
            if (isSportsContext && isSportsWhitelistWord(word.toLowerCase(), language)) {
              console.log(`🏆 Sports whitelist: "${word}" allowed in ${context} context`);
              continue; // Skip this violation for sports context
            }
            
            console.log(`❌ Found violation: "${word}" in category ${category} (${data.severity})`);
            violations.push({
              category,
              severity: data.severity,
              word,
              language,
              type: 'direct_match'
            });
          }
        }
      }
    }
  }

  // Check context patterns
  if (checkPatterns) {
    for (const pattern of CONTEXT_PATTERNS) {
      if (pattern.pattern.test(text)) {
        violations.push({
          category: pattern.category,
          severity: pattern.severity,
          pattern: pattern.pattern.toString(),
          type: 'context_pattern'
        });
      }
    }
  }

  // Determine overall result
  const isClean = violations.length === 0;
  const maxSeverity = violations.length > 0 
    ? violations.reduce((max, v) => {
        const severityOrder = [SEVERITY_LEVELS.LOW, SEVERITY_LEVELS.MEDIUM, SEVERITY_LEVELS.HIGH, SEVERITY_LEVELS.CRITICAL];
        return severityOrder.indexOf(v.severity) > severityOrder.indexOf(max) ? v.severity : max;
      }, SEVERITY_LEVELS.LOW)
    : null;

  return {
    isClean,
    violations,
    maxSeverity,
    categories: [...new Set(violations.map(v => v.category))],
    shouldBlock: violations.some(v => 
      [SEVERITY_LEVELS.MEDIUM, SEVERITY_LEVELS.HIGH, SEVERITY_LEVELS.CRITICAL].includes(v.severity)
    ),
    shouldWarn: violations.some(v => v.severity === SEVERITY_LEVELS.LOW),
    shouldFlag: violations.some(v => 
      [SEVERITY_LEVELS.HIGH, SEVERITY_LEVELS.CRITICAL].includes(v.severity)
    )
  };
};

// Get user-friendly violation message
export const getViolationMessage = (violations, categories) => {
  const categoryMessages = {
    [FILTER_CATEGORIES.POLITICS]: 'political discussions',
    [FILTER_CATEGORIES.NUDITY]: 'adult or explicit content',
    [FILTER_CATEGORIES.VIOLENCE]: 'violent or threatening content',
    [FILTER_CATEGORIES.HATE_SPEECH]: 'hate speech or offensive language',
    [FILTER_CATEGORIES.SPAM]: 'promotional or spam content',
    [FILTER_CATEGORIES.DRUGS]: 'content related to drugs or alcohol'
  };

  if (categories.length === 0) return '';
  
  if (categories.length === 1) {
    return `This content appears to contain ${categoryMessages[categories[0]]}. AmaPlayer is a sports community focused on positive interactions.`;
  } else {
    const categoryNames = categories.map(cat => categoryMessages[cat]).join(', ');
    return `This content appears to contain inappropriate material including: ${categoryNames}. AmaPlayer is a sports community focused on positive interactions.`;
  }
};

// Clean text by removing/replacing inappropriate content
export const cleanText = (text, violations) => {
  let cleanedText = text;
  
  violations.forEach(violation => {
    if (violation.type === 'direct_match') {
      const regex = new RegExp(violation.word, 'gi');
      cleanedText = cleanedText.replace(regex, '*'.repeat(violation.word.length));
    }
  });
  
  return cleanedText;
};

// Check if content should be auto-moderated
export const shouldAutoModerate = (violations) => {
  return violations.some(v => 
    [SEVERITY_LEVELS.HIGH, SEVERITY_LEVELS.CRITICAL].includes(v.severity)
  );
};

// Log content violation for admin review
export const logViolation = async (userId, content, violations, context) => {
  const violationLog = {
    userId,
    content: content.substring(0, 500), // Limit stored content
    violations,
    context, // 'post', 'message', 'comment', etc.
    timestamp: new Date(),
    reviewed: false,
    action: null
  };
  
  console.log('Content violation logged:', violationLog);
  
  // Note: Violation logging is handled in-memory for development.
  // In production, consider implementing Firebase storage for admin review.
  return violationLog;
};

// Export filter categories and severity levels for use in components
export { FILTER_CATEGORIES, SEVERITY_LEVELS };