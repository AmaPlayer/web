import { createContext, useContext, useState, useEffect, ReactElement } from 'react';
import { 
  LanguageContextValue, 
  LanguageProviderProps, 
  Language,
  LanguageCode,
  TranslationKey,
  Translations
} from '../types/contexts/language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Indian Regional Languages
export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' }
];

// Translations for different languages
export const translations: Translations = {
  en: {
    // Navigation
    amaplayer: 'AmaPlayer',
    home: 'Home',
    search: 'Search',
    add: 'Add',
    activity: 'Activity',
    messages: 'Messages',
    profile: 'Profile',
    
    // Landing Page
    heroTitle: 'AmaPlayer',
    heroSubtitle: 'The Ultimate Sports Community Platform',
    heroDescription: 'Connect with athletes, share your achievements, and showcase your talent to the world.',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    features: 'Features',
    featuresTitle: 'Everything You Need for Sports',

    // Welcome Page
    tagline: 'CONNECT COMPETE AND CONQUER',
    subtitle: "LET'S PLAY TOGETHER AND RISE",
    letsPlay: "LET'S PLAY",
    joinForFree: 'Join for Free',
    athlete: 'Athlete',
    coach: 'Coach',
    organization: 'Organization',
    parent: 'Parent',
    vision: 'Our Vision',
    visionText: 'To create a global platform that connects athletes, coaches, and sports enthusiasts, empowering them to showcase their talent and achieve their dreams.',
    mission: 'Our Mission',
    missionText: 'To provide innovative tools and opportunities for athletes to connect, grow, and succeed in their sporting journey while building a vibrant community.',
    
    // Features
    shareAchievements: 'Share Achievements',
    shareAchievementsDesc: 'Showcase your sports victories and milestones with the community.',
    talentShowcase: 'Talent Showcase',
    talentShowcaseDesc: 'Upload videos and demonstrate your skills to scouts and fans.',
    connectAthletes: 'Connect with Athletes',
    connectAthletesDesc: 'Build your network with fellow athletes, coaches, and sports enthusiasts.',
    
    // Authentication
    login: 'Login',
    signup: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    forgotPassword: 'Forgot Password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signInWithGoogle: 'Sign in with Google',
    signInWithApple: 'Sign in with Apple',
    continueAsGuest: 'Continue as Guest',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    
    // Posts
    createPost: 'Create Post',
    whatsOnYourMind: "What's on your mind?",
    sharePost: 'Share Post',
    addPhoto: 'Add Photo',
    addVideo: 'Add Video',
    postShared: 'Post shared successfully!',
    writeCaption: 'Write a caption...',
    
    // Profile
    followers: 'Followers',
    following: 'Following',
    posts: 'Posts',
    editProfile: 'Edit Profile',
    bio: 'Bio',
    location: 'Location',
    website: 'Website',
    
    // Comments
    writeComment: 'Write a comment...',
    comments: 'Comments',
    reply: 'Reply',
    like: 'Like',
    
    // Guest Mode
    guestMode: 'Guest Mode',
    signUpToInteract: 'Sign up to like, comment, and post',
    signUpToComment: 'Sign up to add comments',
    
    // Footer
    copyright: '© 2024 AmaPlayer. All rights reserved.',
    
    // Language
    chooseLanguage: 'Choose Language'
  },
  
  hi: {
    // Navigation
    amaplayer: 'अमाप्लेयर',
    home: 'होम',
    search: 'खोजें',
    add: 'जोड़ें',
    activity: 'गतिविधि',
    messages: 'संदेश',
    profile: 'प्रोफाइल',
    
    // Landing Page
    heroTitle: 'अमाप्लेयर',
    heroSubtitle: 'अंतिम खेल समुदाय मंच',
    heroDescription: 'एथलीटों से जुड़ें, अपनी उपलब्धियों को साझा करें, और दुनिया को अपनी प्रतिभा दिखाएं।',
    getStarted: 'शुरू करें',
    learnMore: 'और जानें',
    features: 'सुविधाएं',
    featuresTitle: 'खेल के लिए आपको चाहिए सब कुछ',

    // Welcome Page
    tagline: 'जुड़ें प्रतिस्पर्धा करें और जीतें',
    subtitle: 'आइए मिलकर खेलें और ऊपर उठें',
    letsPlay: 'चलो खेलें',
    joinForFree: 'मुफ्त में शामिल हों',
    athlete: 'एथलीट',
    coach: 'कोच',
    organization: 'संगठन',
    parent: 'अभिभावक',
    vision: 'हमारी दृष्टि',
    visionText: 'एक वैश्विक मंच बनाना जो एथलीटों, कोचों और खेल प्रेमियों को जोड़ता है, उन्हें अपनी प्रतिभा दिखाने और अपने सपनों को प्राप्त करने का अधिकार देता है।',
    mission: 'हमारा मिशन',
    missionText: 'एथलीटों को जुड़ने, बढ़ने और अपनी खेल यात्रा में सफल होने के लिए नवीन उपकरण और अवसर प्रदान करना, साथ ही एक जीवंत समुदाय का निर्माण करना।',
    
    // Features
    shareAchievements: 'उपलब्धियां साझा करें',
    shareAchievementsDesc: 'समुदाय के साथ अपनी खेल जीत और मील के पत्थर दिखाएं।',
    talentShowcase: 'प्रतिभा प्रदर्शन',
    talentShowcaseDesc: 'वीडियो अपलोड करें और स्काउट्स और प्रशंसकों को अपने कौशल दिखाएं।',
    connectAthletes: 'एथलीटों से जुड़ें',
    connectAthletesDesc: 'साथी एथलीटों, कोचों और खेल प्रेमियों के साथ अपना नेटवर्क बनाएं।',
    
    // Authentication
    login: 'लॉगिन',
    signup: 'साइन अप',
    signOut: 'साइन आउट',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    fullName: 'पूरा नाम',
    forgotPassword: 'पासवर्ड भूल गए?',
    dontHaveAccount: 'खाता नहीं है?',
    alreadyHaveAccount: 'पहले से खाता है?',
    signInWithGoogle: 'Google के साथ साइन इन करें',
    signInWithApple: 'Apple के साथ साइन इन करें',
    continueAsGuest: 'मेहमान के रूप में जारी रखें',
    
    // Common
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    back: 'वापस',
    next: 'अगला',
    previous: 'पिछला',
    close: 'बंद करें',
    
    // Posts
    createPost: 'पोस्ट बनाएं',
    whatsOnYourMind: 'आपके मन में क्या है?',
    sharePost: 'पोस्ट साझा करें',
    addPhoto: 'फोटो जोड़ें',
    addVideo: 'वीडियो जोड़ें',
    postShared: 'पोस्ट सफलतापूर्वक साझा किया गया!',
    writeCaption: 'कैप्शन लिखें...',
    
    // Profile
    followers: 'फॉलोअर्स',
    following: 'फॉलोइंग',
    posts: 'पोस्ट',
    editProfile: 'प्रोफाइल संपादित करें',
    bio: 'बायो',
    location: 'स्थान',
    website: 'वेबसाइट',
    
    // Comments
    writeComment: 'टिप्पणी लिखें...',
    comments: 'टिप्पणियां',
    reply: 'जवाब',
    like: 'पसंद',
    
    // Guest Mode
    guestMode: 'मेहमान मोड',
    signUpToInteract: 'लाइक, कमेंट और पोस्ट करने के लिए साइन अप करें',
    signUpToComment: 'टिप्पणी जोड़ने के लिए साइन अप करें',
    
    // Footer
    copyright: '© 2024 अमाप्लेयर। सभी अधिकार सुरक्षित।',
    
    // Language
    chooseLanguage: 'भाषा चुनें'
  },

  // Add basic translations for other languages
  pa: {
    amaplayer: 'ਅਮਾਪਲੇਅਰ',
    home: 'ਘਰ',
    search: 'ਖੋਜ',
    add: 'ਜੋੜੋ',
    messages: 'ਸੁਨੇਹੇ',
    profile: 'ਪ੍ਰੋਫਾਈਲ',
    chooseLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ'
  },

  mr: {
    amaplayer: 'अमाप्लेयर',
    home: 'होम',
    search: 'शोध',
    add: 'जोडा',
    messages: 'संदेश',
    profile: 'प्रोफाइल',
    chooseLanguage: 'भाषा निवडा'
  },

  bn: {
    amaplayer: 'আমাপ্লেয়ার',
    home: 'হোম',
    search: 'খুঁজুন',
    add: 'যোগ করুন',
    messages: 'বার্তা',
    profile: 'প্রোফাইল',
    chooseLanguage: 'ভাষা বেছে নিন'
  },

  ta: {
    amaplayer: 'அமாப்ளேயர்',
    home: 'வீடு',
    search: 'தேடல்',
    add: 'சேர்',
    messages: 'செய்திகள்',
    profile: 'விவரம்',
    chooseLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்'
  },

  te: {
    amaplayer: 'అమాప్లేయర్',
    home: 'హోమ్',
    search: 'వెతకండి',
    add: 'జోడించు',
    messages: 'సందేశాలు',
    profile: 'ప్రొఫైల్',
    chooseLanguage: 'భాష ఎంచుకోండి'
  },

  kn: {
    amaplayer: 'ಅಮಾಪ್ಲೇಯರ್',
    home: 'ಮನೆ',
    search: 'ಹುಡುಕಿ',
    add: 'ಸೇರಿಸು',
    messages: 'ಸಂದೇಶಗಳು',
    profile: 'ಪ್ರೊಫೈಲ್',
    chooseLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ'
  },

  ml: {
    amaplayer: 'അമാപ്ലേയർ',
    home: 'ഹോം',
    search: 'തിരയുക',
    add: 'ചേർക്കുക',
    messages: 'സന്ദേശങ്ങൾ',
    profile: 'പ്രൊഫൈൽ',
    chooseLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക'
  },

  gu: {
    amaplayer: 'અમાપ્લેયર',
    home: 'હોમ',
    search: 'શોધ',
    add: 'ઉમેરો',
    messages: 'સંદેશા',
    profile: 'પ્રોફાઇલ',
    chooseLanguage: 'ભાષા પસંદ કરો'
  },

  or: {
    amaplayer: 'ଅମାପ୍ଲେୟାର',
    home: 'ହୋମ',
    search: 'ଖୋଜନ୍ତୁ',
    add: 'ଯୋଗ କରନ୍ତୁ',
    messages: 'ବାର୍ତ୍ତା',
    profile: 'ପ୍ରୋଫାଇଲ',
    chooseLanguage: 'ଭାଷା ବାଛନ୍ତୁ'
  },

  as: {
    amaplayer: 'আমাপ্লেয়াৰ',
    home: 'ঘৰ',
    search: 'বিচাৰক',
    add: 'যোগ কৰক',
    messages: 'বাৰ্তা',
    profile: 'প্ৰফাইল',
    chooseLanguage: 'ভাষা বাছনি কৰক'
  }
};

export function LanguageProvider({ children }: LanguageProviderProps): ReactElement {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && languages.find(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage as LanguageCode);
    }
  }, []);

  const changeLanguage = (languageCode: LanguageCode): void => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('selectedLanguage', languageCode);
  };

  const getCurrentLanguage = (): Language => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  const t = (key: TranslationKey): string => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const value: LanguageContextValue = {
    currentLanguage,
    changeLanguage,
    getCurrentLanguage,
    t,
    languages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
