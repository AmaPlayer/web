# AmaPlayer - Firebase Database Schemas

## Firestore Collections Architecture

### 1. Users Collection (`users`)
```javascript
{
  uid: "user_12345", // Document ID matches Firebase Auth UID
  displayName: "John Athlete",
  email: "john@example.com",
  photoURL: "https://storage.googleapis.com/...",
  bio: "Professional basketball player",
  sport: "Basketball",
  role: "athlete", // athlete | coach | organization | fan
  location: {
    city: "Los Angeles",
    state: "California", 
    country: "USA"
  },
  skills: ["Shooting", "Defense", "Leadership"],
  achievements: ["State Champion 2023", "MVP Award"],
  stats: {
    followers: 1245,
    following: 234,
    posts: 156,
    stories: 89
  },
  isVerified: false,
  isPublic: true,
  gender: "male", // male | female | other | prefer_not_to_say
  age: 24,
  dateOfBirth: "1999-03-15", // Optional, used for age calculation
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastActiveAt: Timestamp,
  settings: {
    privacy: {
      showEmail: false,
      showLocation: true,
      allowMessages: true
    },
    notifications: {
      likes: true,
      comments: true,
      follows: true,
      messages: true
    },
    language: "en"
  }
}
```

### 2. Posts Collection (`posts`)
```javascript
{
  postId: "post_12345", // Auto-generated document ID
  userId: "user_12345",
  userDisplayName: "John Athlete",
  userPhotoURL: "https://storage.googleapis.com/...",
  caption: "Just finished an amazing training session! 💪",
  mediaType: "image", // image | video | text
  mediaUrl: "https://storage.googleapis.com/...", // Optional for text posts
  mediaMetadata: {
    width: 1080,
    height: 1080,
    size: 2048000, // bytes
    duration: 15.5, // seconds (for videos)
    thumbnail: "https://storage.googleapis.com/..." // for videos
  },
  sport: "Basketball",
  location: {
    city: "Los Angeles",
    venue: "Staples Center"
  },
  tags: ["training", "basketball", "workout"],
  mentions: ["@coach_mike", "@teammate_sarah"],
  likes: 234,
  likedBy: ["user_123", "user_456"], // First 50 users for quick access
  comments: 45,
  shares: 12,
  views: 1245, // For video posts
  isPublic: true,
  isPinned: false,
  timestamp: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  moderationStatus: "approved", // pending | approved | rejected | flagged
  contentFlags: {
    hasInappropriateContent: false,
    hasViolentContent: false,
    hasSpamContent: false,
    flaggedByUsers: 0,
    lastReviewed: Timestamp
  }
}
```

### 3. Comments Collection (`comments`)
```javascript
{
  commentId: "comment_12345",
  postId: "post_12345",
  userId: "user_12345",
  userDisplayName: "John Athlete", 
  userPhotoURL: "https://storage.googleapis.com/...",
  text: "Great post! Keep up the good work!",
  mediaUrl: "https://storage.googleapis.com/...", // Optional attached media
  mediaType: "image", // image | video | null
  parentCommentId: null, // For reply threads
  likes: 12,
  likedBy: ["user_123", "user_456"],
  replies: 3, // Count of direct replies
  mentions: ["@john_athlete"],
  timestamp: Timestamp,
  isEdited: false,
  editedAt: null,
  moderationStatus: "approved",
  contentFlags: {
    hasInappropriateContent: false,
    flaggedByUsers: 0
  }
}
```

### 4. Stories Collection (`stories`)
```javascript
{
  storyId: "story_12345",
  userId: "user_12345",
  userDisplayName: "John Athlete",
  userPhotoURL: "https://storage.googleapis.com/...",
  mediaType: "image", // image | video
  mediaUrl: "https://storage.googleapis.com/...",
  thumbnail: "https://storage.googleapis.com/...", // For videos
  caption: "Training session complete! 💪",
  timestamp: Timestamp,
  expiresAt: Timestamp, // 24 hours from creation
  viewCount: 89,
  viewers: ["user_123", "user_456"], // Array of user IDs who viewed
  isHighlight: false,
  highlightId: null, // If saved to highlight
  sharingEnabled: true,
  publicLink: "https://amaplayer.app/story/story_12345",
  location: {
    city: "Los Angeles",
    venue: "Training Center"
  },
  sport: "Basketball",
  createdAt: Timestamp
}
```

### 5. Highlights Collection (`highlights`)
```javascript
{
  highlightId: "highlight_12345",
  userId: "user_12345",
  title: "Training Sessions",
  coverImage: "https://storage.googleapis.com/...",
  storyIds: ["story_123", "story_456", "story_789"],
  storyCount: 3,
  isPublic: true,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  viewCount: 245,
  description: "Best training moments from this month"
}
```

### 6. Story Views Collection (`storyViews`)
```javascript
{
  viewId: "view_12345",
  storyId: "story_12345",
  viewerId: "user_12345",
  viewedAt: Timestamp,
  viewDuration: 3000, // milliseconds
  deviceInfo: {
    platform: "web", // web | ios | android
    userAgent: "Mozilla/5.0..."
  }
}
```

### 7. Follows Collection (`follows`)
```javascript
{
  followId: "follow_12345", // Auto-generated
  followerId: "user_12345", // Who is following
  followerName: "John Athlete",
  followerPhotoURL: "https://storage.googleapis.com/...",
  followingId: "user_67890", // Who is being followed
  followingName: "Jane Coach",
  followingPhotoURL: "https://storage.googleapis.com/...",
  timestamp: Timestamp,
  isActive: true,
  notifications: true // Whether follower gets notifications from this user
}
```

### 8. Friend Requests Collection (`friendRequests`)
```javascript
{
  requestId: "request_12345",
  senderId: "user_12345",
  senderName: "John Athlete",
  senderPhotoURL: "https://storage.googleapis.com/...",
  receiverId: "user_67890", 
  receiverName: "Jane Coach",
  status: "pending", // pending | accepted | rejected | cancelled
  timestamp: Timestamp,
  respondedAt: Timestamp, // When accepted/rejected
  message: "Hi! I'd like to connect with you." // Optional message
}
```

### 9. Friendships Collection (`friendships`)
```javascript
{
  friendshipId: "friendship_12345",
  user1: "user_12345", // Lower UID comes first (for consistency)
  user1Name: "John Athlete",
  user2: "user_67890",
  user2Name: "Jane Coach",
  createdAt: Timestamp,
  status: "active", // active | blocked_by_user1 | blocked_by_user2
  lastInteraction: Timestamp,
  mutualFriends: 15, // Count of mutual connections
  connectionStrength: 0.85 // Algorithm-based connection score
}
```

### 10. Messages Collection (`messages`)
```javascript
{
  messageId: "message_12345",
  conversationId: "conv_user123_user456", // Consistent format: user IDs sorted
  senderId: "user_12345",
  senderName: "John Athlete",
  receiverId: "user_67890",
  receiverName: "Jane Coach",
  message: "Hey! Great training session today!",
  mediaUrl: "https://storage.googleapis.com/...", // Optional
  mediaType: "image", // image | video | audio | document | null
  messageType: "text", // text | media | system | reaction
  replyTo: null, // messageId of message being replied to
  reactions: {
    "👍": ["user_123", "user_456"],
    "❤️": ["user_789"]
  },
  timestamp: Timestamp,
  readAt: Timestamp, // When receiver read the message
  deliveredAt: Timestamp,
  isEdited: false,
  editedAt: null,
  isDeleted: false,
  deletedAt: null,
  moderationStatus: "approved"
}
```

### 11. Content Reports Collection (`contentReports`)
```javascript
{
  reportId: "report_12345",
  contentId: "post_12345", // ID of reported content
  contentType: "post", // post | comment | message | user | story
  contentOwnerId: "user_67890",
  reporterId: "user_12345",
  reporterName: "John Athlete",
  reasons: ["spam", "inappropriate_content"], // Array of violation types
  category: "content_violation", // content_violation | harassment | spam | fake_account
  description: "This post contains inappropriate content",
  evidence: {
    screenshots: ["https://storage.googleapis.com/..."],
    additionalInfo: "User repeatedly posts non-sports content"
  },
  priority: "medium", // low | medium | high | critical
  status: "pending", // pending | under_review | resolved | dismissed
  timestamp: Timestamp,
  reviewedAt: Timestamp,
  reviewedBy: "admin_user_123",
  resolution: "content_removed", // warning | content_removed | user_suspended | no_action
  resolutionNotes: "Content removed due to policy violation"
}
```

### 12. Moderation Logs Collection (`moderationLogs`)
```javascript
{
  logId: "log_12345",
  moderatorId: "admin_user_123",
  moderatorName: "Admin John",
  action: "remove_content", // remove_content | warn_user | suspend_user | approve_content
  targetType: "post", // post | comment | user | story | message
  targetId: "post_12345",
  targetOwnerId: "user_67890",
  reason: "Inappropriate content",
  details: {
    reportId: "report_12345",
    automated: false,
    policyViolation: "community_guidelines_section_2",
    appealable: true
  },
  timestamp: Timestamp,
  ip: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}
```

### 13. User Violations Collection (`userViolations`)
```javascript
{
  userId: "user_12345", // Document ID is the user ID
  totalViolations: 3,
  violations: [
    {
      violationId: "violation_123",
      type: "inappropriate_content",
      severity: "medium", // low | medium | high | critical
      contentId: "post_12345",
      reportId: "report_12345",
      action: "content_removed",
      timestamp: Timestamp,
      appealStatus: "not_appealed" // not_appealed | appealed | appeal_approved | appeal_denied
    }
  ],
  warningsCount: 1,
  suspensionsCount: 0,
  accountStatus: "active", // active | warned | suspended | banned
  lastViolation: Timestamp,
  riskScore: 0.3, // 0.0 to 1.0 - higher means more risk
  notes: "User warned about content policy compliance"
}
```

### 14. Conversations Collection (`conversations`)
```javascript
{
  conversationId: "conv_user123_user456",
  participants: ["user_12345", "user_67890"],
  participantDetails: {
    "user_12345": {
      name: "John Athlete",
      photoURL: "https://storage.googleapis.com/...",
      lastSeen: Timestamp,
      unreadCount: 2
    },
    "user_67890": {
      name: "Jane Coach", 
      photoURL: "https://storage.googleapis.com/...",
      lastSeen: Timestamp,
      unreadCount: 0
    }
  },
  lastMessage: {
    senderId: "user_12345",
    message: "See you at practice!",
    timestamp: Timestamp,
    messageType: "text"
  },
  messageCount: 45,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isArchived: false,
  isMuted: false,
  isBlocked: false,
  blockedBy: null // userId of who blocked the conversation
}
```

### 15. Notifications Collection (`notifications`)
```javascript
{
  notificationId: "notification_12345",
  userId: "user_12345", // Who receives the notification
  type: "like", // like | comment | follow | message | mention | story_view
  fromUserId: "user_67890",
  fromUserName: "Jane Coach",
  fromUserPhotoURL: "https://storage.googleapis.com/...",
  contentId: "post_12345", // Related content ID
  contentType: "post", // post | comment | story | message
  message: "Jane Coach liked your post",
  isRead: false,
  timestamp: Timestamp,
  readAt: Timestamp,
  actionUrl: "/post/post_12345", // Deep link to related content
  metadata: {
    postCaption: "Training session complete!",
    postThumbnail: "https://storage.googleapis.com/..."
  }
}
```

## Index Requirements

### Composite Indexes Needed:
1. **Posts**: `userId` + `timestamp` (desc)
2. **Posts**: `sport` + `timestamp` (desc)
3. **Posts**: `isPublic` + `timestamp` (desc)
4. **Stories**: `expiresAt` + `timestamp` (desc)
5. **Stories**: `userId` + `expiresAt` + `timestamp` (desc)
6. **Messages**: `conversationId` + `timestamp` (desc)
7. **Follows**: `followerId` + `timestamp` (desc)
8. **Follows**: `followingId` + `timestamp` (desc)
9. **Comments**: `postId` + `timestamp` (desc)
10. **Notifications**: `userId` + `isRead` + `timestamp` (desc)
11. **Content Reports**: `status` + `priority` + `timestamp` (desc)
12. **User Violations**: `accountStatus` + `riskScore` (desc)

### Events Collection Indexes (Enhanced Schema v2):
13. **Events**: `category` + `startDate` (desc)
14. **Events**: `sport` + `startDate` (desc)
15. **Events**: `status` + `startDate` (desc)
16. **Events**: `category` + `sport` + `startDate` (desc)
17. **Events**: `visibility.isFeatured` (desc) + `trendingScore` (desc)
18. **Events**: `visibility.isDiscoverable` + `startDate` (desc)
19. **Events**: `tags` (array-contains) + `startDate` (desc)
20. **Events**: `location.coordinates.geohash` + `startDate` (desc) _(for location-based queries)_
21. **Events**: `requirements.skillLevel` + `startDate` (desc)
22. **Events**: `eventType` + `status` + `startDate` (desc)
23. **Events**: `metadata.version` + `createdAt` (desc) _(for migration tracking)_
24. **Events**: `createdBy` + `status` + `startDate` (desc)
25. **Events**: `lastActivityAt` (desc) _(for recent activity sorting)_

### Event Subcollections Indexes:
26. **Participants**: `events/{eventId}/participants` - `type` + `registeredAt` (desc)
27. **Participants**: `events/{eventId}/participants` - `registrationStatus` + `registeredAt` (desc)
28. **Reactions**: `events/{eventId}/reactions` - `reactionType` + `timestamp` (desc)
29. **Analytics**: `events/{eventId}/analytics` - `date` (desc)

### Other Collections:
30. **Participations** _(deprecated)_: `userId` + `timestamp` (desc)
31. **Participations** _(deprecated)_: `eventId` + `timestamp` (desc)
32. **Participations** _(deprecated)_: `userId` + `type` + `timestamp` (desc)
33. **Achievements**: `userId` + `earnedAt` (desc)
34. **Achievements**: `userId` + `badgeType` + `earnedAt` (desc)
35. **Leaderboards**: `type` + `period` + `rank` (asc)
36. **Leaderboards**: `type` + `period` + `score` (desc)
37. **Challenges**: `eventId` + `startDate` (desc)

### 15. Events Collection (`events`) - Enhanced Schema v2

**⚠️ Schema Migration Note**: This is the new enhanced schema. Events using the old schema should be migrated using the migration script at `scripts/migrate-events-schema.js`. Key changes include moving participant/reaction arrays to subcollections and adding structured location data.

```javascript
{
  eventId: "event_12345", // Auto-generated document ID

  // ========== Basic Information ==========
  title: "City Basketball Championship 2025",
  description: "Annual basketball tournament for amateur athletes",
  sport: "Basketball",
  tags: ["tournament", "basketball", "championship", "youth"], // For better discovery

  // ========== Enhanced Location ==========
  // NEW: Structured location with coordinates for geoqueries
  location: {
    displayName: "Mumbai Sports Complex, Mumbai, India",
    venue: "Mumbai Sports Complex",
    address: {
      street: "Main Stadium Road",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      postalCode: "400001"
    },
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777,
      geohash: "te7mu2jm" // For efficient location-based queries
    }
  },

  // ========== Dates & Time ==========
  startDate: Timestamp,
  endDate: Timestamp, // Optional
  timezone: "Asia/Kolkata", // NEW: Critical for global events
  registrationStartDate: Timestamp, // NEW: When registration opens
  registrationEndDate: Timestamp,   // NEW: When registration closes

  // ========== Status & Classification ==========
  status: "upcoming", // upcoming | ongoing | completed | cancelled | postponed
  category: "upcoming", // upcoming | ongoing_tournament | amaplayer | past_events
  eventType: "tournament", // community | tournament | talent_hunt
  hostType: "user", // user | amaplayer_official

  // ========== Organizer Information ==========
  createdBy: "user_12345",
  organizerInfo: { // NEW: Denormalized for performance
    userId: "user_12345",
    displayName: "John Doe",
    photoURL: "https://storage.googleapis.com/...",
    email: "contact@example.com",
    phone: "+91-1234567890",
    isVerified: true
  },

  // ========== Media Files ==========
  // NEW: Support for multiple media files (video and images)
  mediaFiles: [
    {
      type: "video",
      url: "https://storage.googleapis.com/...",
      thumbnailUrl: "https://storage.googleapis.com/...",
      isPrimary: true,
      duration: 120, // seconds
      size: 25000000 // bytes
    },
    {
      type: "image",
      url: "https://storage.googleapis.com/...",
      isPrimary: false
    }
  ],

  // ========== Capacity & Registration ==========
  // NEW: Enhanced capacity tracking
  capacity: {
    maxParticipants: 100,
    currentParticipants: 45, // Real-time count
    waitlistEnabled: true,
    currentWaitlist: 5,
    registrationRequired: true,
    approvalRequired: false // Auto-accept or manual approval
  },

  // ========== Engagement Metrics ==========
  // CHANGED: Arrays moved to subcollections to prevent document size issues
  metrics: {
    participantCount: 45,    // Total "going"
    interestedCount: 23,     // Total "interested"
    maybeCount: 12,          // Total "maybe"
    viewCount: 1245,
    shareCount: 34,
    commentCount: 67,
    reactionCount: 156,
    uniqueVisitors: 892
  },

  // ========== Visibility & Access ==========
  // NEW: Fine-grained visibility controls
  visibility: {
    isPublic: true,
    isDiscoverable: true,      // Show in search/explore
    isFeatured: false,         // Featured by admin
    isSponsored: false,        // Promoted event
    requiresApproval: false    // Approval needed to view
  },

  // ========== Financial Information ==========
  // NEW: Registration fees and prizes
  financial: {
    isFree: true,
    registrationFee: 0,
    currency: "INR",
    prizes: ["Trophy", "Cash Prize: ₹50,000"],
    totalPrizePool: 50000,
    paymentRequired: false,
    refundPolicy: "Full refund until 24h before event"
  },

  // ========== Event Specific ==========
  isOfficial: false,        // AmaPlayer official event
  isTrending: false,
  trendingScore: 0,         // Calculated score for trending algorithm
  qualityScore: 8.5,        // NEW: AI/algorithm-based quality score

  // ========== Talent Hunt Specific ==========
  // Optional: Only present for talent_hunt events
  talentHunt: {
    submissionDeadline: Timestamp,
    votingDeadline: Timestamp,
    submissionCount: 45,
    maxSubmissionsPerUser: 1,
    votingEnabled: true,
    judgesEnabled: true,
    judges: ["judge_user_1", "judge_user_2"]
  },

  // ========== Requirements & Rules ==========
  // NEW: Eligibility and participation requirements
  requirements: {
    minAge: 13,
    maxAge: null,
    skillLevel: "all", // all | beginner | intermediate | advanced | professional
    equipmentNeeded: ["Basketball shoes", "Jersey"],
    rules: "Standard basketball rules apply...",
    eligibilityCriteria: "Open to all amateur athletes"
  },

  // ========== Social Features ==========
  // NEW: Control social interactions
  social: {
    allowComments: true,
    allowReactions: true,
    allowSharing: true,
    discussionEnabled: true,
    chatEnabled: true,        // Live chat during event
    streamingUrl: null        // For live streaming
  },

  // ========== Notifications ==========
  // NEW: Notification tracking
  notifications: {
    reminderSent: false,
    reminderScheduled: Timestamp, // 24h before event
    updateNotificationsEnabled: true
  },

  // ========== Admin & Moderation ==========
  moderation: {
    isApproved: true,
    approvedBy: "admin_123",
    approvedAt: Timestamp,
    flagCount: 0,
    reportCount: 0,
    moderationNotes: null
  },

  // ========== Timestamps ==========
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastActivityAt: Timestamp,  // NEW: For sorting by recent activity
  publishedAt: Timestamp,     // NEW: When event was made public

  // ========== Metadata ==========
  // NEW: Schema versioning and migration tracking
  metadata: {
    source: "web",            // web | mobile | api
    version: 2,               // Schema version
    migrated: true,           // Whether migrated from old schema
    migratedAt: Timestamp,
    importedFrom: null        // If imported from external system
  }
}
```

#### Events Subcollections

**⚠️ Important**: Participant and reaction data are now stored in subcollections instead of arrays to prevent hitting Firestore's 1MB document size limit.

##### `events/{eventId}/participants/{userId}`
```javascript
{
  userId: "user_123",
  userName: "John Doe",
  userPhotoURL: "https://storage.googleapis.com/...",
  userEmail: "user@example.com",
  type: "going", // going | interested | maybe
  registeredAt: Timestamp,
  registrationStatus: "confirmed", // pending | confirmed | waitlist | cancelled
  ticketId: "ticket_123",
  paymentStatus: "completed", // not_required | pending | completed | refunded
  checkInStatus: "not_checked_in", // not_checked_in | checked_in
  checkInTime: Timestamp,
  metadata: {
    source: "web",
    notificationsEnabled: true,
    reminderSet: true
  }
}
```

##### `events/{eventId}/reactions/{userId}`
```javascript
{
  userId: "user_123",
  userName: "John Doe",
  reactionType: "🔥", // 🔥 | 💪 | ⚡ | 👏 | ❤️
  timestamp: Timestamp
}
```

##### `events/{eventId}/analytics/summary`
```javascript
{
  // Aggregate analytics (updated periodically)
  totalViews: 1245,
  totalUniqueViews: 892,
  totalShares: 34,
  totalComments: 67,
  totalReactions: 156,
  totalParticipants: 45,
  peakConcurrentUsers: 120,
  averageEngagementTime: 180, // seconds
  lastUpdated: Timestamp,

  // Referral sources
  referralSources: {
    direct: 50,
    social: 30,
    search: 20
  },

  // Daily breakdown
  dailyStats: [
    {
      date: "2025-01-15",
      views: 150,
      registrations: 25,
      cancellations: 2
    }
  ]
}
```

##### `events/{eventId}/analytics/daily_{date}`
```javascript
{
  date: "2025-01-15",
  views: 150,
  uniqueViews: 120,
  shares: 10,
  reactions: 25,
  comments: 15,
  registrations: 25,
  cancellations: 2,
  peakConcurrentUsers: 45,
  avgEngagementTime: 180, // seconds
  hourlyBreakdown: {
    "00": 5, "01": 2, ..., "23": 8 // views per hour
  }
}
```

### 16. Participations Collection (`participations`)

**Note**: This collection is now **deprecated** in favor of the `events/{eventId}/participants` subcollection. It's kept for backward compatibility but new implementations should use subcollections.

```javascript
{
  participationId: "participation_12345", // Auto-generated document ID
  userId: "user_12345",
  eventId: "event_12345",
  type: "going", // going | interested | maybe
  timestamp: Timestamp,
  metadata: {
    source: "web", // web | mobile
    notificationsEnabled: true,
    reminderSet: true
  }
}
```

### 17. Achievements Collection (`achievements`)
```javascript
{
  achievementId: "achievement_12345", // Auto-generated document ID
  userId: "user_12345",
  badgeType: "participation", // participation | milestone | streak | special
  badgeName: "First Event",
  earnedAt: Timestamp,
  eventId: "event_12345", // Optional, if related to specific event
  metadata: {
    description: "Joined your first event",
    icon: "🏆",
    points: 10,
    rarity: "common" // common | rare | epic | legendary
  }
}
```

### 18. Leaderboards Collection (`leaderboards`)
```javascript
{
  leaderboardId: "leaderboard_12345", // Auto-generated document ID
  userId: "user_12345",
  userName: "John Athlete",
  userPhotoURL: "https://storage.googleapis.com/...",
  score: 1250,
  rank: 5,
  type: "engagement", // engagement | participation | achievements
  period: "weekly", // daily | weekly | monthly | allTime
  updatedAt: Timestamp,
  metadata: {
    eventsJoined: 15,
    achievementsEarned: 8,
    streakDays: 7
  }
}
```

### 19. Challenges Collection (`challenges`)
```javascript
{
  challengeId: "challenge_12345", // Auto-generated document ID
  eventId: "event_12345",
  title: "3-Point Shooting Challenge",
  description: "Make 10 three-pointers in a row",
  type: "skill", // skill | endurance | creativity | team
  startDate: Timestamp,
  endDate: Timestamp,
  participants: ["user_123", "user_456"], // Array of participant user IDs
  submissions: [
    {
      userId: "user_123",
      videoUrl: "https://storage.googleapis.com/...",
      submittedAt: Timestamp,
      votes: 45,
      status: "approved" // pending | approved | rejected
    }
  ],
  prizes: ["Badge", "50 Points"],
  rules: "Submit a video showing your attempt...",
  maxSubmissions: 1,
  votingEnabled: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 20. Event Stats Subcollection (`users/{userId}/eventStats`)
```javascript
{
  statsId: "stats", // Fixed document ID
  totalEvents: 25, // Total events created by user
  eventsJoined: 45, // Total events joined
  eventsCompleted: 38, // Total events completed
  engagementPoints: 1250, // Total engagement points
  achievementCount: 12, // Total achievements earned
  currentStreak: 7, // Current participation streak (days)
  longestStreak: 15, // Longest participation streak
  lastActivity: Timestamp,
  favoritesSports: ["Basketball", "Football"], // Most participated sports
  participationRate: 0.84, // Completion rate
  updatedAt: Timestamp
}
```

## Security Rules Implementation

All collections implement:
- **Authentication**: Users must be logged in
- **Authorization**: Users can only modify their own content
- **Validation**: Data structure and content validation
- **Content Filtering**: Basic inappropriate content detection
- **Guest Restrictions**: Read-only access for anonymous users
- **Admin Access**: Special permissions for moderators and admins

## Performance Considerations

1. **Pagination**: All lists use cursor-based pagination
2. **Denormalization**: User details cached in posts/comments for performance
3. **Counters**: Stats like followers/posts stored as separate fields
4. **Indexing**: Strategic composite indexes for common queries
5. **Clean-up**: Automated removal of expired stories and old data
6. **Caching**: Frequently accessed data cached client-side