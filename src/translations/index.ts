/**
 * Unified Translations
 * 
 * Consolidated translation strings from LanguageContext and LoginLanguageContext
 * Supporting 12 Indian regional languages for all UI content
 * 
 * Performance optimizations:
 * - Uses Map for O(1) translation lookups
 * - Caches frequently accessed translations
 * - Lazy initialization of translation maps
 */

import { Language, LanguageCode, Translations } from '../types/contexts/preferences';

/**
 * Supported languages with native names
 */
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

/**
 * Consolidated translations for all languages
 * Merged from LanguageContext and LoginLanguageContext
 */
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
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.moments': 'Moments',
    'nav.events': 'Events',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.notifications': 'Notifications',
    'nav.unread': 'unread',
    'nav.guestMode': 'Guest Mode',
    'nav.goBack': 'Go back to previous page',
    skipToMainContent: 'Skip to main content',

    // Landing Page
    heroTitle: 'AmaPlayer',
    heroSubtitle: 'The Ultimate Sports Community Platform',
    heroDescription: 'Connect with athletes, share your achievements, and showcase your talent to the world.',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    features: 'Features',
    featuresTitle: 'Everything You Need for Sports',
    events: 'Events',

    // Welcome Page
    welcome: 'Welcome to AmaPlayer',
    tagline: 'CONNECT COMPETE AND CONQUER',
    subtitle: "LET'S PLAY TOGETHER AND RISE",
    letsPlay: "Let's Play",
    joinForFree: 'Join for Free',
    vision: 'Our Vision',
    visionText: 'To create a global platform that connects athletes, coaches, and sports enthusiasts, empowering them to showcase their talent and achieve their dreams.',
    mission: 'Our Mission',
    missionText: 'To provide innovative tools and opportunities for athletes to connect, grow, and succeed in their sporting journey while building a vibrant community.',
    
    // Roles
    athlete: 'Athlete',
    coach: 'Coach',
    organization: 'Organization',
    parent: 'Parent',
    spouse: 'Spouse',
    
    // Role Descriptions
    athleteDescription: 'Showcase your talent and connect with coaches',
    coachDescription: 'Discover and train the next generation',
    organizationDescription: 'Manage teams and competitions',
    parentDescription: 'Track your child\'s athletic journey',
    spouseDescription: 'Support your athlete partner',
    
    // Features
    shareAchievements: 'Share Achievements',
    shareAchievementsDesc: 'Showcase your sports victories and milestones with the community.',
    talentShowcase: 'Talent Showcase',
    talentShowcaseDesc: 'Upload videos and demonstrate your skills to scouts and fans.',
    connectAthletes: 'Connect with Athletes',
    connectAthletesDesc: 'Build your network with fellow athletes, coaches, and sports enthusiasts.',

    // Authentication
    login: 'Login',
    logout: 'Logout',
    signup: 'Sign Up',
    signOut: 'Sign Out',
    signUp: 'Sign up',
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
    joiningAs: 'Joining as',
    enterYourEmail: 'Enter your email',
    enterYourPassword: 'Enter your password',
    loginAs: 'Login as',
    enterCredentials: 'Enter your credentials to continue',
    loginFunctionalityComingSoon: 'Login functionality will be implemented next.',
    keepMeLoggedIn: 'Keep me logged in',
    signingIn: 'Signing in...',
    connecting: 'Connecting...',
    joinAmaPlayerWithGoogle: 'Join AmaPlayer with Google',
    signInWithAppleButton: 'Sign in with Apple',
    hidePassword: 'Hide password',
    showPassword: 'Show password',
    goToWelcomePage: 'Go to Welcome Page',
    invalidEmail: 'Invalid email',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Password must be at least 6 characters',
    loginSuccessful: 'Login Successful',
    welcomeBack: 'Welcome back! Redirecting to your dashboard...',
    loginFailed: 'Login Failed',
    guestLoginFailed: 'Guest Login Failed',
    googleLoginFailed: 'Google Login Failed',
    appleLoginFailed: 'Apple Login Failed',
    passwordsDoNotMatch: 'Passwords do not match',
    failedToCreateAccount: 'Failed to create an account',
    failedToSignUpWithGoogle: 'Failed to sign up with Google',
    failedToSignUpWithApple: 'Failed to sign up with Apple',
    appleSignInNotEnabled: 'Apple Sign-in is not enabled. Please contact support.',
    signInCancelled: 'Sign-in was cancelled',
    signUpWithGoogle: 'Sign up with Google',
    signUpWithApple: 'Sign up with Apple',
    developmentTools: 'Development Tools',
    testFirebaseConnection: 'Test Firebase Connection',
    runningDiagnostics: 'Running Diagnostics...',
    
    // Common
    loading: 'Loading...',
    loadingProfile: 'Loading profile...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    backToHome: 'Back to Home',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    submit: 'Submit',
    retry: 'Retry',
    done: 'Done',
    active: 'active',
    required: 'required',
    
    // Modal & Dialog Actions
    noCommentsYet: 'No comments yet',
    beFirstToComment: 'Be the first to comment on this post!',
    sendComment: 'Send comment',
    signInToComment: 'Sign in to join the conversation',
    filters: 'Filters',
    content: 'Content',
    engagement: 'Engagement',
    user: 'User',
    resetAll: 'Reset All',
    applyFilters: 'Apply Filters',
    reportContent: 'Report Content',
    reportSubmitted: 'Report Submitted',
    reportSubmittedMessage: 'Thank you for helping keep AmaPlayer safe! Your report has been submitted and will be reviewed by our moderation team.',
    reportId: 'Report ID',
    submitting: 'Submitting...',
    submitReport: 'Submit Report',
    shares: 'shares',
    processing: 'Processing...',
    requestVerification: 'Request Verification',
    creatingRequest: 'Creating Request...',
    verificationRequestCreated: 'Verification Request Created!',
    creating: 'Creating...',
    createVerificationRequest: 'Create Verification Request',
    dismissNotification: 'Dismiss notification',
    tryAgain: 'Try Again',
    dismissError: 'Dismiss error',
    somethingWentWrong: 'Something went wrong',

    // Form & Upload
    uploadVideo: 'Upload Video',
    dragDropVideo: 'Drag and drop your video here, or click to browse',
    supportedFormats: 'Supported formats',
    maximumSize: 'Maximum size',
    chooseVideo: 'Choose Video',
    pause: 'Pause',
    play: 'Play',
    mute: 'Mute',
    unmute: 'Unmute',
    fullscreen: 'Fullscreen',
    size: 'Size',
    type: 'Type',
    removeVideo: 'Remove video',

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
    personalDetails: 'Personal Details',
    name: 'Name',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    mobile: 'Mobile',
    city: 'City',
    playerType: 'Player Type',
    sport: 'Sport',
    position: 'Position',
    role: 'Role',
    notSpecified: 'Not specified',
    
    // Comments
    writeComment: 'Write a comment...',
    comments: 'Comments',
    reply: 'Reply',
    like: 'Like',
    
    // Notifications
    notificationsEnabled: '🔔 Notifications enabled! You\'ll now get notified when someone likes your posts.',
    
    // Feed Card
    follow: 'Follow',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    views: 'views',
    
    // Guest Mode
    guestMode: 'Guest Mode',
    signUpToInteract: 'Sign up to like, comment, and post',
    signUpToComment: 'Sign up to add comments',
    
    // Role Selection Page
    welcomeToAmaplayer: 'Welcome to AmaPlayer',
    chooseYourRole: 'Choose your role to continue',
    chooseRole: 'Choose Your Role',
    
    // About Page
    welcomeTo: 'Welcome to',
    yourJourney: 'Your journey to athletic excellence starts here',
    ourMission: 'Our Mission',
    missionDescription: 'To create the world\'s most comprehensive platform that connects athletes, coaches, and organizations, fostering talent development and creating opportunities for athletic excellence across all sports disciplines.',
    ourVision: 'Our Vision',
    visionDescription: 'To revolutionize the sports industry by building a global ecosystem where every athlete has access to world-class coaching, every coach can discover exceptional talent, and every organization can build championship-winning teams.',
    watchOurStory: 'Watch Our Story',
    videoLoadError: 'If you\'re seeing this, the video failed to load. Please check the console for errors.',
    videoNotSupported: 'Your browser does not support the video tag.',
    continueToLogin: 'Continue to Login',
    chooseDifferentRole: 'Choose Different Role',
    
    // Athlete Onboarding
    chooseYourSport: 'Choose Your Sport',
    selectSportsDescription: 'Select the sports you\'re interested in. You can choose multiple sports.',
    searchSports: 'Search sports...',
    clearSearch: 'Clear search',
    noSportsFound: 'No sports found matching',
    continueWithSports: 'Continue with',
    sports: 'sports',
    selectAtLeastOneSport: 'Select at least one sport to continue',
    pleaseSelectAtLeastOneSport: 'Please select at least one sport',
    chooseYourPosition: 'Choose Your Position',
    whatPositionDoYouPlay: 'What position do you play in',
    positionSelectionDescription: 'This helps us provide relevant content and connect you with similar players.',
    noPositionsAvailable: 'No positions available for',
    chooseDifferentSport: 'Choose Different Sport',
    selectPositionToContinue: 'Select a position to continue',
    continueAs: 'Continue as',
    welcomeToAmaPlayer: 'Welcome to AmaPlayer!',
    personalizedSportsJourney: 'Your personalized sports journey starts here',
    yourSports: 'Your Sports',
    readyToConnect: 'Ready to connect with fellow athletes',
    yourPositionAndSpecialty: 'Your Position & Specialty',
    yourSpecializedArea: 'Your specialized area of expertise',
    yourSpecializations: 'Your Specializations',
    yourUniquePlayingStyle: 'Your unique playing style and preferences',
    editMyProfile: 'Edit My Profile',
    loadingYourProfile: 'Loading your profile...',
    noSpecializationsSelected: 'No specializations selected',
    multipleSports: 'Multiple Sports',
    
    // Footer
    copyright: '© 2024 AmaPlayer. All rights reserved.',
    
    // Language
    chooseLanguage: 'Choose Language',
    selectLanguage: 'Select Language',
    availableLanguages: 'Available languages',
    
    // Settings
    settings: 'Settings',
    account: 'Account',
    security: 'Security',
    privacy: 'Privacy',
    notifications: 'Notifications',
    privacySettings: 'Privacy Settings',
    privacyDescription: 'Control your privacy and visibility settings.',
    notificationPreferences: 'Notification Preferences',
    notificationDescription: 'Manage your notification settings.',
    unsavedChanges: 'Unsaved Changes',
    unsavedChangesMessage: 'You have unsaved changes that will be lost. Are you sure you want to leave?',
    unsavedChangesTabMessage: 'You have unsaved changes in this tab. Are you sure you want to switch tabs?',
    leave: 'Leave',
    stay: 'Stay',
    switchTab: 'Switch Tab',
    loadingSettings: 'Loading settings...',
    
    // Moments
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    
    // Stories
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    
    // Events
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    
    // Events Feature
    createEvent: 'Create Event',
    createNewEvent: 'Create New Event',
    eventTitle: 'Event Title',
    enterEventTitle: 'Enter event title',
    description: 'Description',
    describeEvent: 'Describe your event (minimum 10 characters)',
    selectSport: 'Select a sport',
    enterLocation: 'Enter event location',
    startDate: 'Start Date',
    endDate: 'End Date',
    eventVideo: 'Event Video',
    creatingEvent: 'Creating event, please wait',
    closeForm: 'Close create event form',
    loadingEvents: 'Loading events...',
    loadingMoreEvents: 'Loading more events...',
    noEventsFound: 'No events found',
    checkBackLater: 'Check back later or create your own event to get started!',
    showAllMore: 'Show All ({{count}} more)',
    noAchievements: 'No achievements yet',
    startParticipating: 'Start participating in events to earn your first achievement!',
    noFilteredAchievements: 'No {{filter}} achievements earned yet. Keep participating to unlock them!',
    rarityBreakdown: 'Rarity Breakdown',
    legendary: 'Legendary',
    epic: 'Epic',
    rare: 'Rare',
    common: 'Common',
    hideEngagementPanel: 'Hide Engagement Panel',
    going: 'Going',
    imGoing: "I'm Going",
    interested: 'Interested',
    maybe: 'Maybe',
    markAsGoing: 'Mark as Going',
    removeGoingStatus: 'Remove Going status',
    markAsInterested: 'Mark as Interested',
    removeInterestedStatus: 'Remove Interested status',
    markAsMaybe: 'Mark as Maybe',
    removeMaybeStatus: 'Remove Maybe status',
    eventFullCapacity: 'Event is at full capacity',
    failedToUpdateParticipation: 'Failed to update participation. Please try again.',
    failedToRemoveParticipation: 'Failed to remove participation. Please try again.',
    
    // Event Details
    eventDetails: 'Event Details',
    participants: 'Participants',
    viewParticipants: 'View Participants',
    joinEvent: 'Join Event',
    leaveEvent: 'Leave Event',
    shareEvent: 'Share Event',
    eventStatus: 'Event Status',
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Badges & Achievements
    achievements: 'Achievements',
    badges: 'Badges',
    earnedBadges: 'Earned Badges',
    lockedBadges: 'Locked Badges',
    badgeProgress: 'Badge Progress',
    unlockBadge: 'Unlock Badge',
    viewAllBadges: 'View All Badges',
    achievementUnlocked: 'Achievement Unlocked!',
    congratulations: 'Congratulations!',
    
    // Leaderboard
    leaderboard: 'Leaderboard',
    leaderboards: 'Leaderboards',
    rank: 'Rank',
    score: 'Score',
    yourRank: 'Your Rank',
    topPlayers: 'Top Players',
    engagementLeaders: 'Engagement Leaders',
    mostActive: 'Most Active',
    achievementMasters: 'Achievement Masters',
    challengeChampions: 'Challenge Champions',
    communityLeaders: 'Community Leaders',
    teamStars: 'Team Stars',
    loadingLeaderboard: 'Loading leaderboard...',
    noParticipantsYet: 'No participants yet',
    beTheFirst: 'Be the first to make your mark!',
    yourPosition: 'Your Position',
    showingTop: 'Showing top',
    of: 'of',
    lastUpdated: 'Last updated',
    
    // Challenges
    challenges: 'Challenges',
    activeChallenges: 'Active Challenges',
    completedChallenges: 'Completed Challenges',
    joinChallenge: 'Join Challenge',
    challengeDetails: 'Challenge Details',
    challengeProgress: 'Challenge Progress',
    timeRemaining: 'Time Remaining',
    challengeCompleted: 'Challenge Completed',
    
    // Teams
    teams: 'Teams',
    myTeam: 'My Team',
    createTeam: 'Create Team',
    joinTeam: 'Join Team',
    leaveTeam: 'Leave Team',
    teamMembers: 'Team Members',
    teamLeaderboard: 'Team Leaderboard',
    inviteToTeam: 'Invite to Team',
    
    // Live Features
    liveNow: 'Live Now',
    liveActivity: 'Live Activity',
    activityFeed: 'Activity Feed',
    recentActivity: 'Recent Activity',
    noRecentActivity: 'No recent activity',
    
    // Stats & Progress
    stats: 'Stats',
    statistics: 'Statistics',
    myStats: 'My Stats',
    eventsJoined: 'Events Joined',
    eventsCreated: 'Events Created',
    eventsCompleted: 'Events Completed',
    totalPoints: 'Total Points',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    level: 'Level',
    progress: 'Progress',
    
    // Filters & Sorting
    filterBy: 'Filter by',
    allEvents: 'All Events',
    myEvents: 'My Events',
    upcomingEvents: 'Upcoming Events',
    ongoingEvents: 'Ongoing Events',
    pastEvents: 'Past Events',
    category: 'Category',
    period: 'Period',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    allTime: 'All Time',
    
    // Notifications
    newEventNotification: 'New event available!',
    eventStartingSoon: 'Event starting soon',
    eventStarted: 'Event has started',
    achievementEarned: 'Achievement earned!',
    rankChanged: 'Your rank has changed',
    challengeInvite: 'Challenge invitation',
    teamInvite: 'Team invitation',
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
    'nav.home': 'होम',
    'nav.search': 'खोजें',
    'nav.moments': 'पल',
    'nav.events': 'कार्यक्रम',
    'nav.messages': 'संदेश',
    'nav.profile': 'प्रोफाइल',
    'nav.settings': 'सेटिंग्स',
    'nav.notifications': 'सूचनाएं',
    'nav.unread': 'अपठित',
    'nav.guestMode': 'अतिथि मोड',
    'nav.goBack': 'पिछले पृष्ठ पर वापस जाएं',
    skipToMainContent: 'मुख्य सामग्री पर जाएं',

    // Landing Page
    heroTitle: 'अमाप्लेयर',
    heroSubtitle: 'अंतिम खेल समुदाय मंच',
    heroDescription: 'एथलीटों से जुड़ें, अपनी उपलब्धियों को साझा करें, और दुनिया को अपनी प्रतिभा दिखाएं।',
    getStarted: 'शुरू करें',
    learnMore: 'और जानें',
    features: 'सुविधाएं',
    featuresTitle: 'खेल के लिए आपको चाहिए सब कुछ',
    events: 'कार्यक्रम',

    // Welcome Page
    welcome: 'अमाप्लेयर में आपका स्वागत है',
    tagline: 'जुड़ें, प्रतिस्पर्धा करें और जीतें',
    subtitle: 'आओ साथ खेलें और आगे बढ़ें',
    letsPlay: 'चलो खेलें',
    joinForFree: 'मुफ्त में शामिल हों',
    vision: 'हमारी दृष्टि',
    visionText: 'एक वैश्विक मंच बनाना जो एथलीटों, कोचों और खेल प्रेमियों को जोड़ता है, उन्हें अपनी प्रतिभा दिखाने और अपने सपनों को प्राप्त करने का अधिकार देता है।',
    mission: 'हमारा मिशन',
    missionText: 'एथलीटों को जुड़ने, बढ़ने और अपनी खेल यात्रा में सफल होने के लिए नवीन उपकरण और अवसर प्रदान करना, साथ ही एक जीवंत समुदाय का निर्माण करना।',
    
    // Roles
    athlete: 'एथलीट',
    coach: 'कोच',
    organization: 'संगठन',
    parent: 'अभिभावक',
    spouse: 'जीवनसाथी',
    
    // Role Descriptions
    athleteDescription: 'अपनी प्रतिभा दिखाएं और कोचों से जुड़ें',
    coachDescription: 'अगली पीढ़ी की खोज करें और प्रशिक्षित करें',
    organizationDescription: 'टीमों और प्रतियोगिताओं का प्रबंधन करें',
    parentDescription: 'अपने बच्चे की एथलेटिक यात्रा को ट्रैक करें',
    spouseDescription: 'अपने एथलीट साथी का समर्थन करें',

    // Features
    shareAchievements: 'उपलब्धियां साझा करें',
    shareAchievementsDesc: 'समुदाय के साथ अपनी खेल जीत और मील के पत्थर दिखाएं।',
    talentShowcase: 'प्रतिभा प्रदर्शन',
    talentShowcaseDesc: 'वीडियो अपलोड करें और स्काउट्स और प्रशंसकों को अपने कौशल दिखाएं।',
    connectAthletes: 'एथलीटों से जुड़ें',
    connectAthletesDesc: 'साथी एथलीटों, कोचों और खेल प्रेमियों के साथ अपना नेटवर्क बनाएं।',
    
    // Authentication
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    signup: 'साइन अप',
    signOut: 'साइन आउट',
    signUp: 'साइन अप करें',
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
    joiningAs: 'इस रूप में शामिल हो रहे हैं',
    enterYourEmail: 'अपना ईमेल दर्ज करें',
    enterYourPassword: 'अपना पासवर्ड दर्ज करें',
    loginAs: 'इस रूप में लॉगिन करें',
    enterCredentials: 'जारी रखने के लिए अपनी साख दर्ज करें',
    loginFunctionalityComingSoon: 'लॉगिन कार्यक्षमता जल्द ही उपलब्ध होगी।',
    
    // Common
    loading: 'लोड हो रहा है...',
    loadingProfile: 'प्रोफाइल लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    back: 'वापस',
    backToHome: 'होम पर वापस जाएं',
    next: 'अगला',
    previous: 'पिछला',
    close: 'बंद करें',
    submit: 'जमा करें',
    retry: 'पुनः प्रयास करें',
    done: 'पूर्ण',
    active: 'सक्रिय',
    required: 'आवश्यक',
    
    // Modal & Dialog Actions
    noCommentsYet: 'अभी तक कोई टिप्पणी नहीं',
    beFirstToComment: 'इस पोस्ट पर टिप्पणी करने वाले पहले व्यक्ति बनें!',
    sendComment: 'टिप्पणी भेजें',
    signInToComment: 'बातचीत में शामिल होने के लिए साइन इन करें',
    filters: 'फ़िल्टर',
    content: 'सामग्री',
    engagement: 'सहभागिता',
    user: 'उपयोगकर्ता',
    resetAll: 'सभी रीसेट करें',
    applyFilters: 'फ़िल्टर लागू करें',
    reportContent: 'सामग्री की रिपोर्ट करें',
    reportSubmitted: 'रिपोर्ट सबमिट की गई',
    reportSubmittedMessage: 'AmaPlayer को सुरक्षित रखने में मदद करने के लिए धन्यवाद! आपकी रिपोर्ट सबमिट कर दी गई है और हमारी मॉडरेशन टीम द्वारा इसकी समीक्षा की जाएगी।',
    reportId: 'रिपोर्ट आईडी',
    submitting: 'सबमिट हो रहा है...',
    submitReport: 'रिपोर्ट सबमिट करें',
    shares: 'शेयर',
    processing: 'प्रोसेस हो रहा है...',
    requestVerification: 'सत्यापन का अनुरोध करें',
    creatingRequest: 'अनुरोध बनाया जा रहा है...',
    verificationRequestCreated: 'सत्यापन अनुरोध बनाया गया!',
    creating: 'बनाया जा रहा है...',
    createVerificationRequest: 'सत्यापन अनुरोध बनाएं',
    dismissNotification: 'सूचना खारिज करें',
    tryAgain: 'पुनः प्रयास करें',
    dismissError: 'त्रुटि खारिज करें',
    somethingWentWrong: 'कुछ गलत हुआ',

    // Form & Upload
    uploadVideo: 'वीडियो अपलोड करें',
    dragDropVideo: 'अपना वीडियो यहां खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें',
    supportedFormats: 'समर्थित प्रारूप',
    maximumSize: 'अधिकतम आकार',
    chooseVideo: 'वीडियो चुनें',
    pause: 'रोकें',
    play: 'चलाएं',
    mute: 'म्यूट करें',
    unmute: 'अनम्यूट करें',
    fullscreen: 'पूर्ण स्क्रीन',
    size: 'आकार',
    type: 'प्रकार',
    removeVideo: 'वीडियो हटाएं',

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
    personalDetails: 'व्यक्तिगत विवरण',
    name: 'नाम',
    dateOfBirth: 'जन्म तिथि',
    gender: 'लिंग',
    mobile: 'मोबाइल',
    city: 'शहर',
    playerType: 'खिलाड़ी प्रकार',
    sport: 'खेल',
    position: 'स्थिति',
    role: 'भूमिका',
    notSpecified: 'निर्दिष्ट नहीं',
    
    // Comments
    writeComment: 'टिप्पणी लिखें...',
    comments: 'टिप्पणियां',
    reply: 'जवाब',
    like: 'पसंद',
    
    // Notifications
    notificationsEnabled: '🔔 सूचनाएं सक्षम! अब आपको सूचना मिलेगी जब कोई आपकी पोस्ट को पसंद करेगा।',
    
    // Feed Card
    follow: 'फॉलो करें',
    minutesAgo: 'मिनट पहले',
    hoursAgo: 'घंटे पहले',
    daysAgo: 'दिन पहले',
    views: 'व्यूज',
    
    // Guest Mode
    guestMode: 'मेहमान मोड',
    signUpToInteract: 'लाइक, कमेंट और पोस्ट करने के लिए साइन अप करें',
    signUpToComment: 'टिप्पणी जोड़ने के लिए साइन अप करें',
    
    // Role Selection Page
    welcomeToAmaplayer: 'अमाप्लेयर में आपका स्वागत है',
    chooseYourRole: 'जारी रखने के लिए अपनी भूमिका चुनें',
    chooseRole: 'अपनी भूमिका चुनें',
    
    // About Page
    welcomeTo: 'आपका स्वागत है',
    yourJourney: 'एथलेटिक उत्कृष्टता की आपकी यात्रा यहाँ से शुरू होती है',
    ourMission: 'हमारा मिशन',
    missionDescription: 'दुनिया का सबसे व्यापक प्लेटफॉर्म बनाना जो एथलीटों, कोचों और संगठनों को जोड़ता है, प्रतिभा विकास को बढ़ावा देता है और सभी खेल विषयों में एथलेटिक उत्कृष्टता के लिए अवसर पैदा करता है।',
    ourVision: 'हमारी दृष्टि',
    visionDescription: 'खेल उद्योग में क्रांति लाने के लिए एक वैश्विक पारिस्थितिकी तंत्र का निर्माण करना जहां हर एथलीट के पास विश्व स्तरीय कोचिंग तक पहुंच हो, हर कोच असाधारण प्रतिभा की खोज कर सके, और हर संगठन चैंपियनशिप जीतने वाली टीमों का निर्माण कर सके।',
    watchOurStory: 'हमारी कहानी देखें',
    videoLoadError: 'यदि आप यह देख रहे हैं, तो वीडियो लोड नहीं हुआ है। कृपया त्रुटियों के लिए कंसोल जांचें।',
    videoNotSupported: 'आपका ब्राउज़र वीडियो टैग का समर्थन नहीं करता है।',
    continueToLogin: 'लॉगिन पर जारी रखें',
    chooseDifferentRole: 'अलग भूमिका चुनें',
    
    // Footer
    copyright: '© 2024 अमाप्लेयर। सभी अधिकार सुरक्षित।',
    
    // Language
    chooseLanguage: 'भाषा चुनें',
    selectLanguage: 'भाषा चुनें',
    availableLanguages: 'उपलब्ध भाषाएं',
    
    // Settings
    settings: 'सेटिंग्स',
    account: 'खाता',
    security: 'सुरक्षा',
    privacy: 'गोपनीयता',
    notifications: 'सूचनाएं',
    privacySettings: 'गोपनीयता सेटिंग्स',
    privacyDescription: 'अपनी गोपनीयता और दृश्यता सेटिंग्स को नियंत्रित करें।',
    notificationPreferences: 'सूचना प्राथमिकताएं',
    notificationDescription: 'अपनी सूचना सेटिंग्स प्रबंधित करें।',
    unsavedChanges: 'असहेजे परिवर्तन',
    unsavedChangesMessage: 'आपके पास असहेजे परिवर्तन हैं जो खो जाएंगे। क्या आप वाकई छोड़ना चाहते हैं?',
    unsavedChangesTabMessage: 'इस टैब में आपके पास असहेजे परिवर्तन हैं। क्या आप वाकई टैब बदलना चाहते हैं?',
    leave: 'छोड़ें',
    stay: 'रहें',
    switchTab: 'टैब बदलें',
    loadingSettings: 'सेटिंग्स लोड हो रही हैं...',
    
    // Moments
    'moments.title': 'पल',
    'moments.empty.title': 'खोजने के लिए कोई पल नहीं',
    'moments.empty.description': 'समुदाय ने अभी तक कोई पल साझा नहीं किया है। सामग्री बनाने और साझा करने वाले पहले व्यक्ति बनें!',
    'moments.error.videoLoad': 'यह वीडियो लोड नहीं हो सका',
    'moments.error.refresh': 'पेज रीफ्रेश करें',
    
    // Stories
    'stories.title': 'कहानियां',
    'stories.addStory': 'कहानी जोड़ें',
    'stories.loading': 'कहानियां लोड हो रही हैं...',
    'stories.active': 'सक्रिय',
    'stories.you': 'आप',
    
    // Events
    'events.title': 'कार्यक्रम',
    'events.comingSoon': 'कार्यक्रम जल्द आ रहे हैं',
    'events.subtitle': 'हम कुछ अद्भुत पर काम कर रहे हैं! कार्यक्रम अनुभाग को आपके लिए और भी बेहतर अनुभव लाने के लिए फिर से डिज़ाइन किया जा रहा है।',
    'events.liveEvents': 'लाइव खेल कार्यक्रम',
    'events.calendar': 'कार्यक्रम कैलेंडर',
    'events.championships': 'चैंपियनशिप और टूर्नामेंट',
    'events.news': 'खेल समाचार और अपडेट',
    'events.stayTuned': 'अपडेट के लिए बने रहें!',
    
    // Events Feature
    createEvent: 'कार्यक्रम बनाएं',
    createNewEvent: 'नया कार्यक्रम बनाएं',
    eventTitle: 'कार्यक्रम शीर्षक',
    enterEventTitle: 'कार्यक्रम शीर्षक दर्ज करें',
    description: 'विवरण',
    describeEvent: 'अपने कार्यक्रम का वर्णन करें (न्यूनतम 10 वर्ण)',
    selectSport: 'एक खेल चुनें',
    enterLocation: 'कार्यक्रम स्थान दर्ज करें',
    startDate: 'प्रारंभ तिथि',
    endDate: 'समाप्ति तिथि',
    eventVideo: 'कार्यक्रम वीडियो',
    creatingEvent: 'कार्यक्रम बना रहे हैं, कृपया प्रतीक्षा करें',
    closeForm: 'कार्यक्रम फॉर्म बंद करें',
    loadingEvents: 'कार्यक्रम लोड हो रहे हैं...',
    loadingMoreEvents: 'अधिक कार्यक्रम लोड हो रहे हैं...',
    noEventsFound: 'कोई कार्यक्रम नहीं मिला',
    checkBackLater: 'बाद में वापस जांचें या शुरू करने के लिए अपना खुद का कार्यक्रम बनाएं!',
    noAchievements: 'अभी तक कोई उपलब्धि नहीं',
    startParticipating: 'अपनी पहली उपलब्धि अर्जित करने के लिए कार्यक्रमों में भाग लेना शुरू करें!',
    noFilteredAchievements: 'अभी तक कोई {{filter}} उपलब्धियां अर्जित नहीं की गई हैं। उन्हें अनलॉक करने के लिए भाग लेते रहें!',
    rarityBreakdown: 'दुर्लभता विवरण',
    going: 'जा रहे हैं',
    imGoing: 'मैं जा रहा हूं',
    interested: 'रुचि है',
    maybe: 'शायद',
    markAsGoing: 'जा रहे हैं के रूप में चिह्नित करें',
    removeGoingStatus: 'जा रहे हैं स्थिति हटाएं',
    markAsInterested: 'रुचि है के रूप में चिह्नित करें',
    removeInterestedStatus: 'रुचि है स्थिति हटाएं',
    markAsMaybe: 'शायद के रूप में चिह्नित करें',
    removeMaybeStatus: 'शायद स्थिति हटाएं',
    eventFullCapacity: 'कार्यक्रम पूरी क्षमता पर है',
    failedToUpdateParticipation: 'भागीदारी अपडेट करने में विफल। कृपया पुनः प्रयास करें।',
    failedToRemoveParticipation: 'भागीदारी हटाने में विफल। कृपया पुनः प्रयास करें।',
    
    // Event Details
    eventDetails: 'कार्यक्रम विवरण',
    participants: 'प्रतिभागी',
    viewParticipants: 'प्रतिभागी देखें',
    joinEvent: 'कार्यक्रम में शामिल हों',
    leaveEvent: 'कार्यक्रम छोड़ें',
    shareEvent: 'कार्यक्रम साझा करें',
    eventStatus: 'कार्यक्रम स्थिति',
    upcoming: 'आगामी',
    ongoing: 'चल रहा है',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    
    // Badges & Achievements
    achievements: 'उपलब्धियां',
    badges: 'बैज',
    earnedBadges: 'अर्जित बैज',
    lockedBadges: 'लॉक बैज',
    badgeProgress: 'बैज प्रगति',
    unlockBadge: 'बैज अनलॉक करें',
    viewAllBadges: 'सभी बैज देखें',
    achievementUnlocked: 'उपलब्धि अनलॉक!',
    congratulations: 'बधाई हो!',
    legendary: 'पौराणिक',
    epic: 'महाकाव्य',
    rare: 'दुर्लभ',
    common: 'सामान्य',
    hideEngagementPanel: 'एंगेजमेंट पैनल छुपाएं',

    // Leaderboard
    leaderboard: 'लीडरबोर्ड',
    leaderboards: 'लीडरबोर्ड',
    rank: 'रैंक',
    score: 'स्कोर',
    yourRank: 'आपकी रैंक',
    topPlayers: 'शीर्ष खिलाड़ी',
    engagementLeaders: 'सहभागिता लीडर',
    mostActive: 'सबसे सक्रिय',
    achievementMasters: 'उपलब्धि मास्टर',
    challengeChampions: 'चुनौती चैंपियन',
    communityLeaders: 'समुदाय लीडर',
    teamStars: 'टीम स्टार',
    loadingLeaderboard: 'लीडरबोर्ड लोड हो रहा है...',
    noParticipantsYet: 'अभी तक कोई प्रतिभागी नहीं',
    beTheFirst: 'अपनी छाप छोड़ने वाले पहले बनें!',
    yourPosition: 'आपकी स्थिति',
    showingTop: 'शीर्ष दिखा रहे हैं',
    of: 'का',
    lastUpdated: 'अंतिम अपडेट',
    
    // Challenges
    challenges: 'चुनौतियां',
    activeChallenges: 'सक्रिय चुनौतियां',
    completedChallenges: 'पूर्ण चुनौतियां',
    joinChallenge: 'चुनौती में शामिल हों',
    challengeDetails: 'चुनौती विवरण',
    challengeProgress: 'चुनौती प्रगति',
    timeRemaining: 'शेष समय',
    challengeCompleted: 'चुनौती पूर्ण',
    
    // Teams
    teams: 'टीमें',
    myTeam: 'मेरी टीम',
    createTeam: 'टीम बनाएं',
    joinTeam: 'टीम में शामिल हों',
    leaveTeam: 'टीम छोड़ें',
    teamMembers: 'टीम सदस्य',
    teamLeaderboard: 'टीम लीडरबोर्ड',
    inviteToTeam: 'टीम में आमंत्रित करें',
    
    // Live Features
    liveNow: 'अभी लाइव',
    liveActivity: 'लाइव गतिविधि',
    activityFeed: 'गतिविधि फ़ीड',
    recentActivity: 'हाल की गतिविधि',
    noRecentActivity: 'कोई हाल की गतिविधि नहीं',
    
    // Stats & Progress
    stats: 'आंकड़े',
    statistics: 'सांख्यिकी',
    myStats: 'मेरे आंकड़े',
    eventsJoined: 'शामिल कार्यक्रम',
    eventsCreated: 'बनाए गए कार्यक्रम',
    eventsCompleted: 'पूर्ण कार्यक्रम',
    totalPoints: 'कुल अंक',
    currentStreak: 'वर्तमान स्ट्रीक',
    longestStreak: 'सबसे लंबी स्ट्रीक',
    
    // Filters & Sorting
    filterBy: 'फ़िल्टर करें',
    allEvents: 'सभी कार्यक्रम',
    myEvents: 'मेरे कार्यक्रम',
    upcomingEvents: 'आगामी कार्यक्रम',
    ongoingEvents: 'चल रहे कार्यक्रम',
    pastEvents: 'पिछले कार्यक्रम',
    category: 'श्रेणी',
    period: 'अवधि',
    today: 'आज',
    thisWeek: 'इस सप्ताह',
    thisMonth: 'इस महीने',
    allTime: 'सभी समय',
    
    // Notifications
    newEventNotification: 'नया कार्यक्रम उपलब्ध!',
    eventStartingSoon: 'कार्यक्रम जल्द शुरू हो रहा है',
    eventStarted: 'कार्यक्रम शुरू हो गया है',
    achievementEarned: 'उपलब्धि अर्जित!',
    rankChanged: 'आपकी रैंक बदल गई है',
    challengeInvite: 'चुनौती आमंत्रण',
    teamInvite: 'टीम आमंत्रण',
  },

  pa: {
    // Navigation
    amaplayer: 'ਅਮਾਪਲੇਅਰ',
    home: 'ਘਰ',
    search: 'ਖੋਜ',
    add: 'ਜੋੜੋ',
    activity: 'ਗਤੀਵਿਧੀ',
    messages: 'ਸੁਨੇਹੇ',
    profile: 'ਪ੍ਰੋਫਾਈਲ',
    'nav.home': 'ਘਰ',
    'nav.search': 'ਖੋਜ',
    'nav.moments': 'ਪਲ',
    'nav.events': 'ਇਵੈਂਟਸ',
    'nav.messages': 'ਸੁਨੇਹੇ',
    'nav.profile': 'ਪ੍ਰੋਫਾਈਲ',
    'nav.settings': 'ਸੈਟਿੰਗਜ਼',
    'nav.notifications': 'ਸੂਚਨਾਵਾਂ',
    'nav.unread': 'ਅਣਪੜ੍ਹੇ',
    'nav.guestMode': 'ਮਹਿਮਾਨ ਮੋਡ',
    'nav.goBack': 'ਪਿਛਲੇ ਪੰਨੇ ਤੇ ਵਾਪਸ ਜਾਓ',
    skipToMainContent: 'ਮੁੱਖ ਸਮੱਗਰੀ ਤੇ ਜਾਓ',

    // Common translations
    login: 'ਲਾਗਇਨ',
    logout: 'ਲਾਗਆਉਟ',
    signup: 'ਸਾਈਨ ਅੱਪ',
    signOut: 'ਸਾਈਨ ਆਉਟ',
    email: 'ਈਮੇਲ',
    password: 'ਪਾਸਵਰਡ',
    back: 'ਵਾਪਸ',
    next: 'ਅਗਲਾ',
    cancel: 'ਰੱਦ ਕਰੋ',
    save: 'ਸੇਵ ਕਰੋ',
    edit: 'ਸੋਧੋ',
    delete: 'ਮਿਟਾਓ',
    loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    chooseLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    availableLanguages: 'ਉਪਲਬਧ ਭਾਸ਼ਾਵਾਂ',
    athlete: 'ਐਥਲੀਟ',
    coach: 'ਕੋਚ',
    organization: 'ਸੰਗਠਨ',
    parent: 'ਮਾਤਾ-ਪਿਤਾ',
    
    // Moments
    'moments.title': 'ਪਲ',
    'moments.empty.title': 'ਖੋਜਣ ਲਈ ਕੋਈ ਪਲ ਨਹੀਂ',
    'moments.empty.description': 'ਭਾਈਚਾਰੇ ਨੇ ਅਜੇ ਤੱਕ ਕੋਈ ਪਲ ਸਾਂਝਾ ਨਹੀਂ ਕੀਤਾ ਹੈ। ਸਮੱਗਰੀ ਬਣਾਉਣ ਅਤੇ ਸਾਂਝਾ ਕਰਨ ਵਾਲੇ ਪਹਿਲੇ ਬਣੋ!',
    'moments.error.videoLoad': 'ਇਹ ਵੀਡੀਓ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕਿਆ',
    'moments.error.refresh': 'ਪੇਜ ਰੀਫ੍ਰੈਸ਼ ਕਰੋ',
    
    // Stories
    'stories.title': 'ਕਹਾਣੀਆਂ',
    'stories.addStory': 'ਕਹਾਣੀ ਜੋੜੋ',
    'stories.loading': 'ਕਹਾਣੀਆਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ...',
    'stories.active': 'ਸਰਗਰਮ',
    'stories.you': 'ਤੁਸੀਂ',
    
    // Events
    'events.title': 'ਇਵੈਂਟਸ',
    'events.comingSoon': 'ਇਵੈਂਟਸ ਜਲਦੀ ਆ ਰਹੇ ਹਨ',
    'events.subtitle': 'ਅਸੀਂ ਕੁਝ ਸ਼ਾਨਦਾਰ ਉੱਤੇ ਕੰਮ ਕਰ ਰਹੇ ਹਾਂ! ਇਵੈਂਟਸ ਸੈਕਸ਼ਨ ਨੂੰ ਤੁਹਾਡੇ ਲਈ ਹੋਰ ਵੀ ਵਧੀਆ ਅਨੁਭਵ ਲਿਆਉਣ ਲਈ ਮੁੜ ਡਿਜ਼ਾਈਨ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ।',
    'events.liveEvents': 'ਲਾਈਵ ਖੇਡ ਇਵੈਂਟਸ',
    'events.calendar': 'ਇਵੈਂਟ ਕੈਲੰਡਰ',
    'events.championships': 'ਚੈਂਪੀਅਨਸ਼ਿਪ ਅਤੇ ਟੂਰਨਾਮੈਂਟ',
    'events.news': 'ਖੇਡ ਖ਼ਬਰਾਂ ਅਤੇ ਅੱਪਡੇਟ',
    'events.stayTuned': 'ਅੱਪਡੇਟਸ ਲਈ ਬਣੇ ਰਹੋ!',
    
    // Events Feature
    createEvent: 'ਇਵੈਂਟ ਬਣਾਓ',
    createNewEvent: 'ਨਵਾਂ ਇਵੈਂਟ ਬਣਾਓ',
    eventTitle: 'ਇਵੈਂਟ ਸਿਰਲੇਖ',
    enterEventTitle: 'ਇਵੈਂਟ ਸਿਰਲੇਖ ਦਾਖਲ ਕਰੋ',
    description: 'ਵੇਰਵਾ',
    describeEvent: 'ਆਪਣੇ ਇਵੈਂਟ ਦਾ ਵਰਣਨ ਕਰੋ (ਘੱਟੋ-ਘੱਟ 10 ਅੱਖਰ)',
    selectSport: 'ਇੱਕ ਖੇਡ ਚੁਣੋ',
    enterLocation: 'ਇਵੈਂਟ ਸਥਾਨ ਦਾਖਲ ਕਰੋ',
    startDate: 'ਸ਼ੁਰੂਆਤ ਤਾਰੀਖ',
    endDate: 'ਸਮਾਪਤੀ ਤਾਰੀਖ',
    eventVideo: 'ਇਵੈਂਟ ਵੀਡੀਓ',
    optional: 'ਵਿਕਲਪਿਕ',
    creating: 'ਬਣਾ ਰਹੇ ਹਾਂ...',
    creatingEvent: 'ਇਵੈਂਟ ਬਣਾ ਰਹੇ ਹਾਂ, ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕ ਕਰੋ',
    closeForm: 'ਇਵੈਂਟ ਫਾਰਮ ਬੰਦ ਕਰੋ',
    characters: 'ਅੱਖਰ',
    loadingEvents: 'ਇਵੈਂਟਸ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...',
    loadingMoreEvents: 'ਹੋਰ ਇਵੈਂਟਸ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...',
    endOfList: 'ਤੁਸੀਂ ਸੂਚੀ ਦੇ ਅੰਤ ਤੱਕ ਪਹੁੰਚ ਗਏ ਹੋ',
    noEventsFound: 'ਕੋਈ ਇਵੈਂਟ ਨਹੀਂ ਮਿਲਿਆ',
    checkBackLater: 'ਬਾਅਦ ਵਿੱਚ ਵਾਪਸ ਜਾਂਚੋ ਜਾਂ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਆਪਣਾ ਖੁਦ ਦਾ ਇਵੈਂਟ ਬਣਾਓ!',
    eventDetails: 'ਇਵੈਂਟ ਵੇਰਵੇ',
    participants: 'ਭਾਗੀਦਾਰ',
    joinEvent: 'ਇਵੈਂਟ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ',
    leaveEvent: 'ਇਵੈਂਟ ਛੱਡੋ',
    shareEvent: 'ਇਵੈਂਟ ਸਾਂਝਾ ਕਰੋ',
    achievements: 'ਪ੍ਰਾਪਤੀਆਂ',
    badges: 'ਬੈਜ',
    leaderboard: 'ਲੀਡਰਬੋਰਡ',
    challenges: 'ਚੁਣੌਤੀਆਂ',
    teams: 'ਟੀਮਾਂ',
    stats: 'ਅੰਕੜੇ',
    going: 'ਜਾ ਰਹੇ ਹਨ',
    interested: 'ਦਿਲਚਸਪੀ',
    maybe: 'ਸ਼ਾਇਦ',
    legendary: 'ਮਹਾਨ',
    epic: 'ਮਹਾਕਾਵਿ',
    rare: 'ਦੁਰਲੱਭ',
    common: 'ਆਮ',
    hideEngagementPanel: 'ਐਂਗੇਜਮੈਂਟ ਪੈਨਲ ਲੁਕਾਓ',
    events: 'ਇਵੈਂਟਸ',
    somethingWentWrong: 'ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ',
    rank: 'ਦਰਜਾ',
    score: 'ਸਕੋਰ',
    points: 'ਅੰਕ',
    level: 'ਪੱਧਰ',
    progress: 'ਤਰੱਕੀ',
  },

  // Placeholder translations for remaining languages (to be completed)
  mr: {
    home: 'होम',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    chooseLanguage: 'भाषा निवडा',
    selectLanguage: 'भाषा निवडा',
    availableLanguages: 'उपलब्ध भाषा',
    'nav.home': 'होम',
    'nav.search': 'शोधा',
    'nav.moments': 'क्षण',
    'nav.events': 'कार्यक्रम',
    'nav.messages': 'संदेश',
    'nav.profile': 'प्रोफाइल',
    'nav.settings': 'सेटिंग्ज',
    'nav.notifications': 'सूचना',
    'nav.unread': 'न वाचलेले',
    'nav.guestMode': 'अतिथी मोड',
    'nav.goBack': 'मागील पृष्ठावर परत जा',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'कार्यक्रम तयार करा',
    joinEvent: 'कार्यक्रमात सामील व्हा',
    leaveEvent: 'कार्यक्रम सोडा',
    eventDetails: 'कार्यक्रम तपशील',
    participants: 'सहभागी',
    achievements: 'यश',
    badges: 'बॅज',
    leaderboard: 'लीडरबोर्ड',
    challenges: 'आव्हाने',
    teams: 'संघ',
    stats: 'आकडेवारी',
    going: 'जात आहे',
    interested: 'स्वारस्य',
    maybe: 'कदाचित',
    legendary: 'पौराणिक',
    epic: 'महाकाव्य',
    rare: 'दुर्मिळ',
    common: 'सामान्य',
    hideEngagementPanel: 'एंगेजमेंट पॅनेल लपवा',
    events: 'कार्यक्रम',
    somethingWentWrong: 'काहीतरी चूक झाली',
    rank: 'रँक',
    score: 'स्कोअर',
    points: 'गुण',
    level: 'स्तर',
    progress: 'प्रगती'
  },

  bn: {
    home: 'হোম',
    login: 'লগইন',
    logout: 'লগআউট',
    chooseLanguage: 'ভাষা নির্বাচন করুন',
    'nav.home': 'হোম',
    'nav.search': 'অনুসন্ধান',
    'nav.moments': 'মুহূর্ত',
    'nav.events': 'ইভেন্ট',
    'nav.messages': 'বার্তা',
    'nav.profile': 'প্রোফাইল',
    'nav.settings': 'সেটিংস',
    'nav.notifications': 'বিজ্ঞপ্তি',
    'nav.unread': 'অপঠিত',
    'nav.guestMode': 'অতিথি মোড',
    'nav.goBack': 'পূর্ববর্তী পৃষ্ঠায় ফিরে যান',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    availableLanguages: 'উপলব্ধ ভাষা',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'ইভেন্ট তৈরি করুন',
    joinEvent: 'ইভেন্টে যোগ দিন',
    leaveEvent: 'ইভেন্ট ছেড়ে দিন',
    eventDetails: 'ইভেন্ট বিবরণ',
    participants: 'অংশগ্রহণকারী',
    achievements: 'অর্জন',
    badges: 'ব্যাজ',
    leaderboard: 'লিডারবোর্ড',
    challenges: 'চ্যালেঞ্জ',
    teams: 'দল',
    stats: 'পরিসংখ্যান',
    going: 'যাচ্ছে',
    interested: 'আগ্রহী',
    maybe: 'হয়তো',
    legendary: 'কিংবদন্তি',
    epic: 'মহাকাব্য',
    rare: 'বিরল',
    common: 'সাধারণ',
    hideEngagementPanel: 'এনগেজমেন্ট প্যানেল লুকান',
    events: 'ইভেন্ট',
    somethingWentWrong: 'কিছু ভুল হয়েছে',
    rank: 'র‍্যাঙ্ক',
    score: 'স্কোর',
    points: 'পয়েন্ট',
    level: 'স্তর',
    progress: 'অগ্রগতি'
  },

  ta: {
    home: 'முகப்பு',
    login: 'உள்நுழைய',
    logout: 'வெளியேறு',
    chooseLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    availableLanguages: 'கிடைக்கும் மொழிகள்',
    'nav.home': 'முகப்பு',
    'nav.search': 'தேடல்',
    'nav.moments': 'தருணங்கள்',
    'nav.events': 'நிகழ்வுகள்',
    'nav.messages': 'செய்திகள்',
    'nav.profile': 'சுயவிவரம்',
    'nav.settings': 'அமைப்புகள்',
    'nav.notifications': 'அறிவிப்புகள்',
    'nav.unread': 'படிக்காதவை',
    'nav.guestMode': 'விருந்தினர் பயன்முறை',
    'nav.goBack': 'முந்தைய பக்கத்திற்குச் செல்லவும்',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'நிகழ்வை உருவாக்கவும்',
    joinEvent: 'நிகழ்வில் சேரவும்',
    leaveEvent: 'நிகழ்வை விட்டு வெளியேறவும்',
    eventDetails: 'நிகழ்வு விவரங்கள்',
    participants: 'பங்கேற்பாளர்கள்',
    achievements: 'சாதனைகள்',
    badges: 'பேட்ஜ்கள்',
    leaderboard: 'லீடர்போர்டு',
    challenges: 'சவால்கள்',
    teams: 'அணிகள்',
    stats: 'புள்ளிவிவரங்கள்',
    going: 'செல்கிறது',
    interested: 'ஆர்வம்',
    maybe: 'ஒருவேளை',
    legendary: 'புராண',
    epic: 'காவியம்',
    rare: 'அரிதான',
    common: 'பொதுவான',
    hideEngagementPanel: 'ஈடுபாட்டு பேனலை மறை',
    events: 'நிகழ்வுகள்',
    somethingWentWrong: 'ஏதோ தவறு நடந்தது',
    rank: 'தரவரிசை',
    score: 'மதிப்பெண்',
    points: 'புள்ளிகள்',
    level: 'நிலை',
    progress: 'முன்னேற்றம்'
  },

  te: {
    home: 'హోమ్',
    login: 'లాగిన్',
    logout: 'లాగౌట్',
    chooseLanguage: 'భాషను ఎంచుకోండి',
    selectLanguage: 'భాషను ఎంచుకోండి',
    availableLanguages: 'అందుబాటులో ఉన్న భాషలు',
    'nav.home': 'హోమ్',
    'nav.search': 'శోధన',
    'nav.moments': 'క్షణాలు',
    'nav.events': 'ఈవెంట్‌లు',
    'nav.messages': 'సందేశాలు',
    'nav.profile': 'ప్రొఫైల్',
    'nav.settings': 'సెట్టింగ్‌లు',
    'nav.notifications': 'నోటిఫికేషన్‌లు',
    'nav.unread': 'చదవనివి',
    'nav.guestMode': 'అతిథి మోడ్',
    'nav.goBack': 'మునుపటి పేజీకి తిరిగి వెళ్ళండి',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'ఈవెంట్ సృష్టించండి',
    joinEvent: 'ఈవెంట్‌లో చేరండి',
    leaveEvent: 'ఈవెంట్ వదిలివేయండి',
    eventDetails: 'ఈవెంట్ వివరాలు',
    participants: 'పాల్గొనేవారు',
    achievements: 'విజయాలు',
    badges: 'బ్యాడ్జ్‌లు',
    leaderboard: 'లీడర్‌బోర్డ్',
    challenges: 'సవాళ్లు',
    teams: 'జట్లు',
    stats: 'గణాంకాలు',
    going: 'వెళ్తున్నారు',
    interested: 'ఆసక్తి',
    maybe: 'బహుశా',
    legendary: 'పురాణ',
    epic: 'మహాకావ్యం',
    rare: 'అరుదైన',
    common: 'సాధారణ',
    hideEngagementPanel: 'ఎంగేజ్‌మెంట్ ప్యానెల్‌ను దాచు',
    events: 'ఈవెంట్‌లు',
    somethingWentWrong: 'ఏదో తప్పు జరిగింది',
    rank: 'ర్యాంక్',
    score: 'స్కోర్',
    points: 'పాయింట్లు',
    level: 'స్థాయి',
    progress: 'పురోగతి'
  },

  kn: {
    home: 'ಹೋಮ್',
    login: 'ಲಾಗಿನ್',
    logout: 'ಲಾಗೌಟ್',
    chooseLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    availableLanguages: 'ಲಭ್ಯವಿರುವ ಭಾಷೆಗಳು',
    'nav.home': 'ಹೋಮ್',
    'nav.search': 'ಹುಡುಕಿ',
    'nav.moments': 'ಕ್ಷಣಗಳು',
    'nav.events': 'ಈವೆಂಟ್‌ಗಳು',
    'nav.messages': 'ಸಂದೇಶಗಳು',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'nav.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'nav.notifications': 'ಅಧಿಸೂಚನೆಗಳು',
    'nav.unread': 'ಓದದಿರುವ',
    'nav.guestMode': 'ಅತಿಥಿ ಮೋಡ್',
    'nav.goBack': 'ಹಿಂದಿನ ಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'ಈವೆಂಟ್ ರಚಿಸಿ',
    joinEvent: 'ಈವೆಂಟ್‌ಗೆ ಸೇರಿ',
    leaveEvent: 'ಈವೆಂಟ್ ಬಿಡಿ',
    eventDetails: 'ಈವೆಂಟ್ ವಿವರಗಳು',
    participants: 'ಭಾಗವಹಿಸುವವರು',
    achievements: 'ಸಾಧನೆಗಳು',
    badges: 'ಬ್ಯಾಡ್ಜ್‌ಗಳು',
    leaderboard: 'ಲೀಡರ್‌ಬೋರ್ಡ್',
    challenges: 'ಸವಾಲುಗಳು',
    teams: 'ತಂಡಗಳು',
    stats: 'ಅಂಕಿಅಂಶಗಳು',
    going: 'ಹೋಗುತ್ತಿದೆ',
    interested: 'ಆಸಕ್ತಿ',
    maybe: 'ಬಹುಶಃ',
    legendary: 'ಪೌರಾಣಿಕ',
    epic: 'ಮಹಾಕಾವ್ಯ',
    rare: 'ಅಪರೂಪದ',
    common: 'ಸಾಮಾನ್ಯ',
    hideEngagementPanel: 'ಎಂಗೇಜ್‌ಮೆಂಟ್ ಪ್ಯಾನೆಲ್ ಅಡಗಿಸಿ',
    events: 'ಈವೆಂಟ್‌ಗಳು',
    somethingWentWrong: 'ಏನೋ ತಪ್ಪಾಗಿದೆ',
    rank: 'ಶ್ರೇಣಿ',
    score: 'ಸ್ಕೋರ್',
    points: 'ಅಂಕಗಳು',
    level: 'ಮಟ್ಟ',
    progress: 'ಪ್ರಗತಿ'
  },

  ml: {
    home: 'ഹോം',
    login: 'ലോഗിൻ',
    logout: 'ലോഗൗട്ട്',
    chooseLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    availableLanguages: 'ലഭ്യമായ ഭാഷകൾ',
    'nav.home': 'ഹോം',
    'nav.search': 'തിരയുക',
    'nav.moments': 'നിമിഷങ്ങൾ',
    'nav.events': 'ഇവന്റുകൾ',
    'nav.messages': 'സന്ദേശങ്ങൾ',
    'nav.profile': 'പ്രൊഫൈൽ',
    'nav.settings': 'ക്രമീകരണങ്ങൾ',
    'nav.notifications': 'അറിയിപ്പുകൾ',
    'nav.unread': 'വായിക്കാത്തവ',
    'nav.guestMode': 'അതിഥി മോഡ്',
    'nav.goBack': 'മുൻ പേജിലേക്ക് മടങ്ങുക',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'ഇവന്റ് സൃഷ്ടിക്കുക',
    joinEvent: 'ഇവന്റിൽ ചേരുക',
    leaveEvent: 'ഇവന്റ് വിടുക',
    eventDetails: 'ഇവന്റ് വിശദാംശങ്ങൾ',
    participants: 'പങ്കെടുക്കുന്നവർ',
    achievements: 'നേട്ടങ്ങൾ',
    badges: 'ബാഡ്ജുകൾ',
    leaderboard: 'ലീഡർബോർഡ്',
    challenges: 'വെല്ലുവിളികൾ',
    teams: 'ടീമുകൾ',
    stats: 'സ്ഥിതിവിവരക്കണക്കുകൾ',
    going: 'പോകുന്നു',
    interested: 'താൽപ്പര്യം',
    maybe: 'ഒരുപക്ഷേ',
    legendary: 'ഐതിഹാസിക',
    epic: 'മഹാകാവ്യം',
    rare: 'അപൂർവ്വം',
    common: 'സാധാരണ',
    hideEngagementPanel: 'എൻഗേജ്‌മെന്റ് പാനൽ മറയ്ക്കുക',
    events: 'ഇവന്റുകൾ',
    somethingWentWrong: 'എന്തോ തെറ്റ് സംഭവിച്ചു',
    rank: 'റാങ്ക്',
    score: 'സ്കോർ',
    points: 'പോയിന്റുകൾ',
    level: 'ലെവൽ',
    progress: 'പുരോഗതി'
  },

  gu: {
    home: 'હોમ',
    login: 'લોગિન',
    logout: 'લોગઆઉટ',
    'nav.home': 'હોમ',
    'nav.search': 'શોધો',
    'nav.moments': 'ક્ષણો',
    'nav.events': 'ઇવેન્ટ્સ',
    'nav.messages': 'સંદેશા',
    'nav.profile': 'પ્રોફાઇલ',
    'nav.settings': 'સેટિંગ્સ',
    'nav.notifications': 'સૂચનાઓ',
    'nav.unread': 'અવાંચિત',
    'nav.guestMode': 'મહેમાન મોડ',
    'nav.goBack': 'પાછલા પૃષ્ઠ પર પાછા જાઓ',
    chooseLanguage: 'ભાષા પસંદ કરો',
    selectLanguage: 'ભાષા પસંદ કરો',
    availableLanguages: 'ઉપલબ્ધ ભાષાઓ',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'ઇવેન્ટ બનાવો',
    joinEvent: 'ઇવેન્ટમાં જોડાઓ',
    leaveEvent: 'ઇવેન્ટ છોડો',
    eventDetails: 'ઇવેન્ટ વિગતો',
    participants: 'સહભાગીઓ',
    achievements: 'સિદ્ધિઓ',
    badges: 'બેજ',
    leaderboard: 'લીડરબોર્ડ',
    challenges: 'પડકારો',
    teams: 'ટીમો',
    stats: 'આંકડા',
    going: 'જઈ રહ્યા છે',
    interested: 'રસ',
    maybe: 'કદાચ',
    legendary: 'પૌરાણિક',
    epic: 'મહાકાવ્ય',
    rare: 'દુર્લભ',
    common: 'સામાન્ય',
    hideEngagementPanel: 'એંગેજમેન્ટ પેનલ છુપાવો',
    events: 'ઇવેન્ટ્સ',
    somethingWentWrong: 'કંઈક ખોટું થયું',
    rank: 'રેન્ક',
    score: 'સ્કોર',
    points: 'પોઇન્ટ્સ',
    level: 'સ્તર',
    progress: 'પ્રગતિ'
  },

  or: {
    home: 'ହୋମ',
    login: 'ଲଗଇନ',
    logout: 'ଲଗଆଉଟ',
    chooseLanguage: 'ଭାଷା ବାଛନ୍ତୁ',
    selectLanguage: 'ଭାଷା ବାଛନ୍ତୁ',
    availableLanguages: 'ଉପଲବ୍ଧ ଭାଷାଗୁଡ଼ିକ',
    'nav.home': 'ହୋମ',
    'nav.search': 'ଖୋଜନ୍ତୁ',
    'nav.moments': 'ମୁହୂର୍ତ୍ତଗୁଡ଼ିକ',
    'nav.events': 'ଇଭେଣ୍ଟଗୁଡ଼ିକ',
    'nav.messages': 'ସନ୍ଦେଶଗୁଡ଼ିକ',
    'nav.profile': 'ପ୍ରୋଫାଇଲ',
    'nav.settings': 'ସେଟିଂସ',
    'nav.notifications': 'ବିଜ୍ଞପ୍ତିଗୁଡ଼ିକ',
    'nav.unread': 'ଅପଠିତ',
    'nav.guestMode': 'ଅତିଥି ମୋଡ',
    'nav.goBack': 'ପୂର୍ବ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'ଇଭେଣ୍ଟ ସୃଷ୍ଟି କରନ୍ତୁ',
    joinEvent: 'ଇଭେଣ୍ଟରେ ଯୋଗ ଦିଅନ୍ତୁ',
    leaveEvent: 'ଇଭେଣ୍ଟ ଛାଡ଼ନ୍ତୁ',
    eventDetails: 'ଇଭେଣ୍ଟ ବିବରଣୀ',
    participants: 'ଅଂଶଗ୍ରହଣକାରୀ',
    achievements: 'ସଫଳତା',
    badges: 'ବ୍ୟାଜ',
    leaderboard: 'ଲିଡରବୋର୍ଡ',
    challenges: 'ଚ୍ୟାଲେଞ୍ଜ',
    teams: 'ଦଳ',
    stats: 'ପରିସଂଖ୍ୟାନ',
    going: 'ଯାଉଛନ୍ତି',
    interested: 'ଆଗ୍ରହୀ',
    maybe: 'ବୋଧହୁଏ',
    legendary: 'କିମ୍ବଦନ୍ତୀ',
    epic: 'ମହାକାବ୍ୟ',
    rare: 'ବିରଳ',
    common: 'ସାଧାରଣ',
    hideEngagementPanel: 'ଏଙ୍ଗେଜମେଣ୍ଟ ପ୍ୟାନେଲ ଲୁଚାନ୍ତୁ',
    events: 'ଇଭେଣ୍ଟଗୁଡ଼ିକ',
    somethingWentWrong: 'କିଛି ଭୁଲ୍ ହୋଇଛି',
    rank: 'ର୍ୟାଙ୍କ',
    score: 'ସ୍କୋର',
    points: 'ପଏଣ୍ଟ',
    level: 'ସ୍ତର',
    progress: 'ପ୍ରଗତି'
  },

  as: {
    home: 'হোম',
    login: 'লগইন',
    logout: 'লগআউট',
    chooseLanguage: 'ভাষা বাছনি কৰক',
    selectLanguage: 'ভাষা বাছনি কৰক',
    availableLanguages: 'উপলব্ধ ভাষাসমূহ',
    'nav.home': 'হোম',
    'nav.search': 'সন্ধান কৰক',
    'nav.moments': 'মুহূৰ্তসমূহ',
    'nav.events': 'ইভেণ্টসমূহ',
    'nav.messages': 'বাৰ্তাসমূহ',
    'nav.profile': 'প্ৰফাইল',
    'nav.settings': 'ছেটিংছ',
    'nav.notifications': 'জাননীসমূহ',
    'nav.unread': 'অপঠিত',
    'nav.guestMode': 'অতিথি মড',
    'nav.goBack': 'পূৰ্বৰ পৃষ্ঠালৈ ঘূৰি যাওক',
    'moments.title': 'Moments',
    'moments.empty.title': 'No Moments to Discover',
    'moments.empty.description': "The community hasn't shared any moments yet. Be the first to create and share content!",
    'moments.error.videoLoad': "This video couldn't be loaded",
    'moments.error.refresh': 'Refresh Page',
    'stories.title': 'Stories',
    'stories.addStory': 'Add Story',
    'stories.loading': 'Loading stories...',
    'stories.active': 'active',
    'stories.you': 'You',
    'events.title': 'Events',
    'events.comingSoon': 'Events Coming Soon',
    'events.subtitle': "We're working on something amazing! The Events section is being redesigned to bring you an even better experience.",
    'events.liveEvents': 'Live Sports Events',
    'events.calendar': 'Event Calendar',
    'events.championships': 'Championships & Tournaments',
    'events.news': 'Sports News & Updates',
    'events.stayTuned': 'Stay tuned for updates!',
    createEvent: 'ইভেণ্ট সৃষ্টি কৰক',
    joinEvent: 'ইভেণ্টত যোগদান কৰক',
    leaveEvent: 'ইভেণ্ট এৰি দিয়ক',
    eventDetails: 'ইভেণ্ট বিৱৰণ',
    participants: 'অংশগ্ৰহণকাৰী',
    achievements: 'সাফল্য',
    badges: 'বেজ',
    leaderboard: 'লিডাৰবৰ্ড',
    challenges: 'প্ৰত্যাহ্বান',
    teams: 'দল',
    stats: 'পৰিসংখ্যা',
    going: 'যাওঁতে',
    interested: 'আগ্ৰহী',
    maybe: 'হয়তো',
    legendary: 'কিংবদন্তী',
    epic: 'মহাকাব্য',
    rare: 'বিৰল',
    common: 'সাধাৰণ',
    hideEngagementPanel: 'এনগেজমেণ্ট পেনেল লুকুৱাওক',
    events: 'ইভেণ্টসমূহ',
    somethingWentWrong: 'কিবা ভুল হল',
    rank: 'ৰেংক',
    score: 'স্কোৰ',
    points: 'পইণ্ট',
    level: 'স্তৰ',
    progress: 'অগ্ৰগতি'
  }
};

/**
 * Translation Maps for optimized O(1) lookups
 * Lazily initialized on first access
 */
const translationMaps: Map<LanguageCode, Map<string, string>> = new Map();

/**
 * Get or create translation map for a language
 * Uses Map for O(1) lookups instead of object property access
 */
function getTranslationMap(languageCode: LanguageCode): Map<string, string> {
  if (!translationMaps.has(languageCode)) {
    const translationObj = translations[languageCode];
    const translationMap = new Map<string, string>();
    
    if (translationObj) {
      Object.entries(translationObj).forEach(([key, value]) => {
        translationMap.set(key, value);
      });
    }
    
    translationMaps.set(languageCode, translationMap);
  }
  
  return translationMaps.get(languageCode)!;
}

/**
 * Translation cache for frequently accessed keys
 * LRU cache with max 100 entries
 */
class TranslationCache {
  private cache: Map<string, string> = new Map();
  private readonly maxSize = 100;
  
  get(key: string): string | undefined {
    const value = this.cache.get(key);
    
    if (value !== undefined) {
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    
    return value;
  }
  
  set(key: string, value: string): void {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Would need hit/miss tracking for accurate rate
    };
  }
}

const translationCache = new TranslationCache();

/**
 * Optimized translation function
 * 
 * Performance features:
 * - Uses Map for O(1) lookups
 * - Caches frequently accessed translations
 * - Efficient fallback to English
 * 
 * @param languageCode - The language to translate to
 * @param key - The translation key
 * @returns The translated string or the key if not found
 */
export function getTranslation(languageCode: LanguageCode, key: string): string {
  // Check cache first
  const cacheKey = `${languageCode}:${key}`;
  const cached = translationCache.get(cacheKey);
  
  if (cached !== undefined) {
    return cached;
  }
  
  // Get translation map for current language
  const currentMap = getTranslationMap(languageCode);
  const translation = currentMap.get(key);
  
  if (translation) {
    translationCache.set(cacheKey, translation);
    return translation;
  }
  
  // Fallback to English
  if (languageCode !== 'en') {
    const englishMap = getTranslationMap('en');
    const englishTranslation = englishMap.get(key);
    
    if (englishTranslation) {
      translationCache.set(cacheKey, englishTranslation);
      return englishTranslation;
    }
  }
  
  // No translation found, return key
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Missing translation for key: ${key} (language: ${languageCode})`);
  }
  
  return key;
}

/**
 * Clear translation cache
 * Useful when translations are updated dynamically
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get translation cache statistics
 */
export function getTranslationCacheStats() {
  return translationCache.getStats();
}

/**
 * Preload translations for a language
 * Useful for warming up the cache
 */
export function preloadTranslations(languageCode: LanguageCode): void {
  getTranslationMap(languageCode);
}

/**
 * Performance measurement utilities
 */
export const translationPerformance = {
  /**
   * Measure translation lookup performance
   */
  measureLookup(languageCode: LanguageCode, key: string, iterations: number = 1000): number {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      getTranslation(languageCode, key);
    }
    
    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    
    return avgTime;
  },
  
  /**
   * Compare Map vs Object lookup performance
   */
  comparePerformance(languageCode: LanguageCode, key: string, iterations: number = 10000): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    // Test Map lookup
    const mapStart = performance.now();
    const translationMap = getTranslationMap(languageCode);
    let mapResult;
    for (let i = 0; i < iterations; i++) {
      mapResult = translationMap.get(key);
    }
    const mapEnd = performance.now();
    const mapTime = mapEnd - mapStart;
    
    
    // Test Object lookup
    const objStart = performance.now();
    const translationObj = translations[languageCode];
    let objResult;
    for (let i = 0; i < iterations; i++) {
      objResult = translationObj?.[key];
    }
    const objEnd = performance.now();
    const objTime = objEnd - objStart;
    

  }
};

// Expose utilities to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).translationUtils = {
    getTranslation,
    clearCache: clearTranslationCache,
    getCacheStats: getTranslationCacheStats,
    preloadTranslations,
    performance: translationPerformance
  };
}
