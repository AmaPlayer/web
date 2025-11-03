// Database Configuration for Multi-Database Architecture

export const DATABASE_CONFIG = {
    // Main application database (default)
    MAIN: {
        name: 'default',
        storageBucket: 'amaplay007.firebasestorage.app',
        description: 'Main application database for users, posts, stories, etc.',
        collections: {
            USERS: 'users',
            POSTS: 'posts',
            STORIES: 'stories',
            COMMENTS: 'comments',
            NOTIFICATIONS: 'notifications',
            MESSAGES: 'messages',
            CONVERSATIONS: 'conversations',
            FRIEND_REQUESTS: 'friendRequests',
            FRIENDSHIPS: 'friendships',
            GROUPS: 'groups',
            SHARES: 'shares',
            FOLLOWS: 'follows',
            REPORTS: 'reports',
            ADMIN_LOGS: 'adminLogs'
        }
    },

    // Events database (isolated)
    EVENTS: {
        name: 'events-db',
        storageBucket: 'amaplay007-events',
        description: 'Dedicated database for events, tournaments, and competitions with separate storage',
        collections: {
            // Core Events
            EVENTS: 'events',
            EVENT_CATEGORIES: 'eventCategories',
            EVENT_TEMPLATES: 'eventTemplates',

            // Participants & Registration
            REGISTRATIONS: 'registrations',
            PARTICIPANTS: 'participants',
            TEAMS: 'teams',

            // Competition Management
            TOURNAMENTS: 'tournaments',
            MATCHES: 'matches',
            BRACKETS: 'brackets',
            ROUNDS: 'rounds',

            // Submissions & Voting
            SUBMISSIONS: 'submissions',
            VOTES: 'votes',
            JUDGES: 'judges',
            SCORING: 'scoring',

            // Analytics & Metrics
            EVENT_ANALYTICS: 'eventAnalytics',
            ENGAGEMENT_METRICS: 'engagementMetrics',
            PERFORMANCE_STATS: 'performanceStats',

            // Media & Content
            EVENT_MEDIA: 'eventMedia',
            LIVE_STREAMS: 'liveStreams',
            HIGHLIGHTS: 'highlights',

            // Communication
            ANNOUNCEMENTS: 'announcements',
            NOTIFICATIONS: 'notifications',
            CHAT_ROOMS: 'chatRooms',

            // Administration
            EVENT_LOGS: 'eventLogs',
            MODERATION: 'moderation',
            REPORTS: 'reports'
        }
    }
} as const;

// Database connection utilities
export const getDatabaseName = (type: keyof typeof DATABASE_CONFIG): string => {
    return DATABASE_CONFIG[type].name;
};

export const getCollections = (type: keyof typeof DATABASE_CONFIG) => {
    return DATABASE_CONFIG[type].collections;
};

// Type definitions
export type DatabaseType = keyof typeof DATABASE_CONFIG;
export type MainCollections = typeof DATABASE_CONFIG.MAIN.collections;
export type EventsCollections = typeof DATABASE_CONFIG.EVENTS.collections;

// Usage examples and benefits
export const DATABASE_BENEFITS = {
    SEPARATION: 'Clean separation of concerns - events data is isolated from main app data',
    SCALABILITY: 'Independent scaling - events database can be optimized separately',
    PERFORMANCE: 'Better performance - queries don\'t interfere with each other',
    MAINTENANCE: 'Easier maintenance - can backup, restore, or migrate events data independently',
    SECURITY: 'Enhanced security - different access rules for different data types',
    DEVELOPMENT: 'Better development experience - clear data boundaries'
};

export default DATABASE_CONFIG;