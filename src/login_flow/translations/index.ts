interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    // Welcome Page
    welcome: "Welcome to AmaPlayer",
    tagline: "CONNECT COMPETE AND CONQUER",
    subtitle: "LET'S PLAY TOGETHER AND RISE",
    letsPlay: "Let's Play",
    vision: "Our Vision",
    visionText: "To create a global platform that connects athletes, coaches, and sports enthusiasts, empowering them to showcase their talent and achieve their dreams.",
    mission: "Our Mission",
    missionText: "To provide innovative tools and opportunities for athletes to connect, grow, and succeed in their sporting journey while building a vibrant community.",
    
    // Common
    login: "Login",
    logout: "Logout",
    signOut: "Sign Out",
    back: "Back",
    backToHome: "Back to Home",
    next: "Next",
    submit: "Submit",
    cancel: "Cancel",
    signup: "Sign Up",
    joiningAs: "Joining as",
    email: "Email",
    password: "Password",
    enterYourEmail: "Enter your email",
    enterYourPassword: "Enter your password",
    loginAs: "Login as",
    enterCredentials: "Enter your credentials to continue",
    loginFunctionalityComingSoon: "Login functionality will be implemented next.",
    dontHaveAccount: "Don't have an account?",
    signUp: "Sign up",
    
    // Role Selection Page
    welcomeToAmaplayer: "Welcome to AmaPlayer",
    chooseYourRole: "Choose your role to continue",
    chooseRole: "Choose Your Role",
    
    // Roles
    athlete: "Athlete",
    coach: "Coach",
    organization: "Organization",
    parent: "Parent",
    spouse: "Spouse",
    
    // Role Descriptions
    athleteDescription: "Showcase your talent and connect with coaches",
    coachDescription: "Discover and train the next generation",
    organizationDescription: "Manage teams and competitions",
    parentDescription: "Track your child's athletic journey",
    
    // About Page
    welcomeTo: "Welcome to",
    yourJourney: "Your journey to athletic excellence starts here",
    ourMission: "Our Mission",
    missionDescription: "To create the world's most comprehensive platform that connects athletes, coaches, and organizations, fostering talent development and creating opportunities for athletic excellence across all sports disciplines.",
    ourVision: "Our Vision",
    visionDescription: "To revolutionize the sports industry by building a global ecosystem where every athlete has access to world-class coaching, every coach can discover exceptional talent, and every organization can build championship-winning teams.",
    watchOurStory: "Watch Our Story",
    videoLoadError: "If you're seeing this, the video failed to load. Please check the console for errors.",
    videoNotSupported: "Your browser does not support the video tag.",
    continueToLogin: "Continue to Login",
    chooseDifferentRole: "Choose Different Role"
  },
  
  // Hindi
  hi: {
    welcome: "अमाप्लेयर में आपका स्वागत है",
    tagline: "जुड़ें, प्रतिस्पर्धा करें और जीतें",
    subtitle: "आओ साथ खेलें और आगे बढ़ें",
    letsPlay: "चलो खेलें",
    
    // Common
    login: "लॉगिन",
    logout: "लॉगआउट",
    signOut: "साइन आउट",
    signup: "साइन अप",
    back: "पीछे",
    backToHome: "होम पर वापस जाएं",
    next: "अगला",
    submit: "जमा करें",
    cancel: "रद्द करें",
    joiningAs: "इस रूप में शामिल हो रहे हैं",
    email: "ईमेल",
    password: "पासवर्ड",
    enterYourEmail: "अपना ईमेल दर्ज करें",
    enterYourPassword: "अपना पासवर्ड दर्ज करें",
    loginAs: "इस रूप में लॉगिन करें",
    enterCredentials: "जारी रखने के लिए अपनी साख दर्ज करें",
    loginFunctionalityComingSoon: "लॉगिन कार्यक्षमता जल्द ही उपलब्ध होगी।",
    dontHaveAccount: "खाता नहीं है?",
    signUp: "साइन अप करें",
    
    // Role Selection Page
    welcomeToAmaplayer: "अमाप्लेयर में आपका स्वागत है",
    chooseYourRole: "जारी रखने के लिए अपनी भूमिका चुनें",
    chooseRole: "अपनी भूमिका चुनें",
    
    // Roles
    athlete: "एथलीट",
    coach: "कोच",
    organization: "संगठन",
    parent: "अभिभावक",
    spouse: "जीवनसाथी",
    
    // Role Descriptions
    athleteDescription: "अपनी प्रतिभा दिखाएं और कोचों से जुड़ें",
    coachDescription: "अगली पीढ़ी की खोज करें और प्रशिक्षित करें",
    organizationDescription: "टीमों और प्रतियोगिताओं का प्रबंधन करें",
    parentDescription: "अपने बच्चे की एथलेटिक यात्रा को ट्रैक करें",
    spouseDescription: "अपने एथलीट साथी का समर्थन करें",
    
    // About Page
    welcomeTo: "आपका स्वागत है",
    yourJourney: "एथलेटिक उत्कृष्टता की आपकी यात्रा यहाँ से शुरू होती है",
    ourMission: "हमारा मिशन",
    missionDescription: "दुनिया का सबसे व्यापक प्लेटफॉर्म बनाना जो एथलीटों, कोचों और संगठनों को जोड़ता है, प्रतिभा विकास को बढ़ावा देता है और सभी खेल विषयों में एथलेटिक उत्कृष्टता के लिए अवसर पैदा करता है।",
    ourVision: "हमारी दृष्टि",
    visionDescription: "खेल उद्योग में क्रांति लाने के लिए एक वैश्विक पारिस्थितिकी तंत्र का निर्माण करना जहां हर एथलीट के पास विश्व स्तरीय कोचिंग तक पहुंच हो, हर कोच असाधारण प्रतिभा की खोज कर सके, और हर संगठन चैंपियनशिप जीतने वाली टीमों का निर्माण कर सके।",
    watchOurStory: "हमारी कहानी देखें",
    videoLoadError: "यदि आप यह देख रहे हैं, तो वीडियो लोड नहीं हुआ है। कृपया त्रुटियों के लिए कंसोल जांचें।",
    videoNotSupported: "आपका ब्राउज़र वीडियो टैग का समर्थन नहीं करता है।",
    continueToLogin: "लॉगिन पर जारी रखें",
    chooseDifferentRole: "अलग भूमिका चुनें"
  },
  
  // Bengali
  bn: {
    // Welcome Page
    welcome: "আমাপ্লেয়ারে স্বাগতম",
    tagline: "সংযুক্ত হোন, প্রতিযোগিতা করুন এবং বিজয়ী হোন",
    subtitle: "আসুন একসাথে খেলি এবং এগিয়ে যাই",
    letsPlay: "চলো খেলি",
    
    // Common
    login: "লগইন",
    logout: "লগআউট",
    signOut: "সাইন আউট",
    signup: "সাইন আপ",
    back: "পিছনে",
    backToHome: "হোমে ফিরে যান",
    next: "পরবর্তী",
    submit: "জমা দিন",
    cancel: "বাতিল",
    joiningAs: "যেমন যোগদান করছেন",
    email: "ইমেইল",
    password: "পাসওয়ার্ড",
    enterYourEmail: "আপনার ইমেইল লিখুন",
    enterYourPassword: "আপনার পাসওয়ার্ড লিখুন",
    loginAs: "লগইন করুন হিসেবে",
    enterCredentials: "চালিয়ে যেতে আপনার শংসাপত্র লিখুন",
    loginFunctionalityComingSoon: "লগইন কার্যকারিতা শীঘ্রই চালু করা হবে।",
    dontHaveAccount: "অ্যাকাউন্ট নেই?",
    signUp: "সাইন আপ করুন",
    
    // Role Selection Page
    welcomeToAmaplayer: "আমাপ্লেয়ারে স্বাগতম",
    chooseYourRole: "চালিয়ে যেতে আপনার ভূমিকা নির্বাচন করুন",
    chooseRole: "আপনার ভূমিকা নির্বাচন করুন",
    
    // Roles
    athlete: "অ্যাথলিট",
    coach: "কোচ",
    organization: "সংগঠন",
    parent: "অভিভাবক",
    spouse: "জীবনসঙ্গী",
    
    // Role Descriptions
    athleteDescription: "আপনার প্রতিভা প্রদর্শন করুন এবং কোচদের সাথে সংযুক্ত হন",
    coachDescription: "পরবর্তী প্রজন্মকে আবিষ্কার করুন এবং প্রশিক্ষণ দিন",
    organizationDescription: "দল এবং প্রতিযোগিতা পরিচালনা করুন",
    parentDescription: "আপনার সন্তানের অ্যাথলেটিক যাত্রা ট্র্যাক করুন",
    spouseDescription: "আপনার অ্যাথলেট সঙ্গীকে সমর্থন করুন",
    
    // About Page
    welcomeTo: "স্বাগতম",
    yourJourney: "অ্যাথলেটিক শ্রেষ্ঠত্বের দিকে আপনার যাত্রা এখান থেকে শুরু হয়",
    ourMission: "আমাদের মিশন",
    missionDescription: "বিশ্বের সবচেয়ে ব্যাপক প্ল্যাটফর্ম তৈরি করা যা অ্যাথলেট, কোচ এবং সংগঠনগুলিকে সংযুক্ত করে, প্রতিভা বিকাশে সহায়তা করে এবং সমস্ত ক্রীড়া শাখায় অ্যাথলেটিক শ্রেষ্ঠত্বের জন্য সুযোগ সৃষ্টি করে।",
    ourVision: "আমাদের ভিশন",
    visionDescription: "একটি বিশ্বব্যাপী বাস্তুতন্ত্র গড়ে তোলার মাধ্যমে ক্রীড়া শিল্পে বিপ্লব ঘটানো যেখানে প্রতিটি অ্যাথলেটের বিশ্বমানের কোচিংয়ের সুযোগ রয়েছে, প্রতিটি কোচ অসাধারণ প্রতিভা আবিষ্কার করতে পারে এবং প্রতিটি সংগঠন চ্যাম্পিয়নশিপ জয়ী দল গঠন করতে পারে।",
    watchOurStory: "আমাদের গল্প দেখুন",
    videoLoadError: "আপনি যদি এটি দেখতে পান তবে ভিডিওটি লোড হয়নি। দয়া করে ত্রুটিগুলির জন্য কনসোল পরীক্ষা করুন।",
    videoNotSupported: "আপনার ব্রাউজার ভিডিও ট্যাগ সমর্থন করে না।",
    continueToLogin: "লগইনে এগিয়ে যান",
    chooseDifferentRole: "ভিন্ন ভূমিকা নির্বাচন করুন"
  },
  
  // Tamil
  ta: {
    // Welcome Page
    welcome: "அமாபிளேயருக்கு வரவேற்கிறோம்",
    tagline: "இணைந்து போட்டியிட்டு வெல்லுங்கள்",
    subtitle: "ஒன்றாக விளையாடி உயர்வோம்",
    letsPlay: "விளையாடுவோம்",
    
    // Common
    login: "உள்நுழைய",
    logout: "வெளியேறு",
    signOut: "வெளியேறு",
    signup: "பதிவு செய்க",
    back: "பின்னால்",
    backToHome: "முகப்புக்கு திரும்பு",
    next: "அடுத்து",
    submit: "சமர்ப்பிக்கவும்",
    cancel: "ரத்து செய்",
    joiningAs: "என சேர்ந்துகொள்கிறேன்",
    email: "மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    enterYourEmail: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
    enterYourPassword: "உங்கள் கடவுச்சொல்லை உள்ளிடவும்",
    loginAs: "புகுபதிகை செய்",
    enterCredentials: "தொடர உங்கள் சான்றுகளை உள்ளிடவும்",
    loginFunctionalityComingSoon: "உள்நுழைவு செயல்பாடு விரைவில் வரும்.",
    dontHaveAccount: "கணக்கு இல்லையா?",
    signUp: "பதிவு செய்க",
    
    // Role Selection Page
    welcomeToAmaplayer: "அமாபிளேயருக்கு வரவேற்கிறோம்",
    chooseYourRole: "தொடர உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்",
    chooseRole: "உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்",
    
    // Roles
    athlete: "ஆட்டக்காரர்",
    coach: "பயிற்சியாளர்",
    organization: "அமைப்பு",
    parent: "பெற்றோர்",
    spouse: "துணைவர்",
    
    // Role Descriptions
    athleteDescription: "உங்கள் திறமையை காட்டி பயிற்சியாளர்களுடன் இணையவும்",
    coachDescription: "அடுத்த தலைமுறையை கண்டறிந்து பயிற்சியளிக்கவும்",
    organizationDescription: "அணிகள் மற்றும் போட்டிகளை நிர்வகிக்கவும்",
    parentDescription: "உங்கள் குழந்தையின் விளையாட்டு பயணத்தை கண்காணிக்கவும்",
    spouseDescription: "உங்கள் விளையாட்டு வீரர் துணையை ஆதரிக்கவும்",
    
    // About Page
    welcomeTo: "வரவேற்கிறோம்",
    yourJourney: "விளையாட்டு சாதனையாளராக உங்கள் பயணம் இங்கே தொடங்குகிறது",
    ourMission: "எங்கள் பணி",
    missionDescription: "ஆட்டக்காரர்கள், பயிற்சியாளர்கள் மற்றும் அமைப்புகளை இணைக்கும் உலகின் மிகவும் விரிவான தளத்தை உருவாக்குவதே எங்கள் பணி, இது திறமை வளர்ச்சியை ஊக்குவித்து, அனைத்து விளையாட்டுத் துறைகளிலும் சிறந்த விளையாட்டு திறன்களுக்கான வாய்ப்புகளை உருவாக்குகிறது.",
    ourVision: "எங்கள் பார்வை",
    visionDescription: "ஒவ்வொரு விளையாட்டு வீரருக்கும் உலகத்தரமான பயிற்சி கிடைக்கும், ஒவ்வொரு பயிற்சியாளரும் அருமையான திறமைகளைக் கண்டறிய முடியும், மேலும் ஒவ்வொரு அமைப்பும் வெற்றி வாகை சூடக்கூடிய அணிகளை உருவாக்க முடியும் என்று உறுதி செய்வதன் மூலம் விளையாட்டுத் துறையில் புரட்சியை ஏற்படுத்துவதே எங்கள் நோக்கம்.",
    watchOurStory: "எங்கள் கதையைப் பார்க்கவும்",
    videoLoadError: "இதை நீங்கள் பார்த்துக் கொண்டிருந்தால், வீடியோ ஏற்றப்படவில்லை. தவறுகளுக்காக கன்சோலை சரிபார்க்கவும்.",
    videoNotSupported: "உங்கள் உலாவி வீடியோ டேக்கை ஆதரிக்கவில்லை.",
    continueToLogin: "உள்நுழையத் தொடரவும்",
    chooseDifferentRole: "வேறு பங்கைத் தேர்ந்தெடுக்கவும்"
  },
  
  // Telugu
  te: {
    // Welcome Page
    welcome: "అమాప్లేయర్‌కు స్వాగతం",
    tagline: "కనెక్ట్ అవ్వండి, పోటీపడండి మరియు గెలవండి",
    subtitle: "కలిసి ఆడి ముందుకు సాగండి",
    letsPlay: "ఆడుకుందాం",
    
    // Common
    login: "లాగిన్",
    logout: "లాగ్‌అవుట్",
    signOut: "సైన్ అవుట్",
    signup: "సైన్ అప్",
    back: "వెనుకకు",
    backToHome: "హోమ్‌కు తిరిగి వెళ్ళు",
    next: "తర్వాత",
    submit: "సమర్పించండి",
    cancel: "రద్దు చేయండి",
    joiningAs: "గా చేరుతున్నారు",
    email: "ఇమెయిల్",
    password: "పాస్వర్డ్",
    enterYourEmail: "మీ ఇమెయిల్‌ని నమోదు చేయండి",
    enterYourPassword: "మీ పాస్‌వర్డ్‌ని నమోదు చేయండి",
    loginAs: "గా లాగిన్ అవ్వండి",
    enterCredentials: "కొనసాగించడానికి మీ డైరలాగిన్ వివరాలు నమోదు చేయండి",
    loginFunctionalityComingSoon: "లాగిన్ కార్యాచరణ త్వరలో అందుబాటులోకి వస్తుంది.",
    dontHaveAccount: "ఖాతా లేదా?",
    signUp: "సైన్ అప్",
    
    // Role Selection Page
    welcomeToAmaplayer: "అమాప్లేయర్‌కు స్వాగతం",
    chooseYourRole: "కొనసాగించడానికి మీ పాత్రను ఎంచుకోండి",
    chooseRole: "మీ పాత్రను ఎంచుకోండి",
    
    // Roles
    athlete: "ఆటగాడు",
    coach: "కోచ్",
    organization: "సంస్థ",
    parent: "తల్లిదండ్రులు",
    spouse: "జీవిత భాగస్వామి",
    
    // Role Descriptions
    athleteDescription: "మీ ప్రతిభను ప్రదర్శించండి మరియు కోచ్‌లతో కనెక్ట్ అవ్వండి",
    coachDescription: "తర్వాతి తరాన్ని కనుగొని శిక్షణ ఇవ్వండి",
    organizationDescription: "టీమ్లు మరియు పోటీలను నిర్వహించండి",
    parentDescription: "మీ పిల్లల అథ్లెటిక్ ప్రయాణాన్ని ట్రాక్ చేయండి",
    spouseDescription: "మీ అథ్లెట్ భాగస్వామికి మద్దతు ఇవ్వండి",
    
    // About Page
    welcomeTo: "స్వాగతం",
    yourJourney: "అథ్లెటిక్ శ్రేష్టతకు మీ ప్రయాణం ఇక్కడ నుండి ప్రారంభమవుతుంది",
    ourMission: "మా మిషన్",
    missionDescription: "అథ్లెట్లు, కోచ్‌లు మరియు సంస్థలను కనెక్ట్ చేసే ప్రపంచంలోనే అత్యంత సమగ్రమైన ప్లాట్‌ఫారమ్‌ను సృష్టించడం, టాలెంట్ అభివృద్ధిని ప్రోత్సహించడం మరియు అన్ని క్రీడా విభాగాలలో అథ్లెటిక్ శ్రేష్టత కోసం అవకాశాలను సృష్టించడం మా లక్ష్యం.",
    ourVision: "మా విజన్",
    visionDescription: "ప్రతి అథ్లెట్‌కు ప్రపంచ స్థాయి కోచింగ్ అందుబాటులో ఉండేలా, ప్రతి కోచ్ అసాధారణమైన ప్రతిభను కనుగొనగలిగేలా మరియు ప్రతి సంస్థ ఛాంపియన్‌షిప్ గెలిచే టీమ్‌లను నిర్మించగలిగేలా ఒక గ్లోబల్ ఎకోసిస్టమ్‌ను నిర్మించడం ద్వారా క్రీడల పరిశ్రమలో విప్లవం సాధించడం మా లక్ష్యం.",
    watchOurStory: "మా కథను చూడండి",
    videoLoadError: "మీరు దీన్ని చూస్తుంటే, వీడియో లోడ్ కాలేదు. దయచేసి లోపాల కోసం కన్సోల్‌ని తనిఖీ చేయండి.",
    videoNotSupported: "మీ బ్రౌజర్ వీడియో ట్యాగ్‌ని మద్దతు ఇవ్వదు.",
    continueToLogin: "లాగిన్‌కు కొనసాగించండి",
    chooseDifferentRole: "వేరే పాత్రను ఎంచుకోండి"
  },
  
  // More Indian languages can be added in the same format
  // Marathi, Gujarati, Kannada, Malayalam, Punjabi, etc.
  
  // Add more translations as needed for other components
};

export const translate = (key: string, language: string = 'en'): string => {
  return translations[language]?.[key] || translations['en'][key] || key;
};

export default translations;
