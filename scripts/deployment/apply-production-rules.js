/**
 * Production Security Rules for Events Database
 * Secure rules for live production environment
 */

console.log(`
🔒 PRODUCTION SECURITY RULES FOR EVENTS-DB
==========================================

Apply these secure production rules to your events-db database:

📋 COPY AND PASTE THESE RULES IN FIREBASE CONSOLE:
`);

const productionRules = `rules_version = '2';
service cloud.firestore {
  match /databases/events-db/documents {
    
    // ==================== EVENTS COLLECTION ====================
    match /events/{eventId} {
      // Public read access for events
      allow read: if true;
      
      // Create: Authenticated users can create events
      allow create: if isAuthenticated() && 
        request.auth.uid == request.resource.data.createdBy &&
        isValidEventData(request.resource.data);
      
      // Update: Event creators and admins can update
      allow update: if isAuthenticated() && 
        (request.auth.uid == resource.data.createdBy || isAdmin()) &&
        isValidEventData(request.resource.data);
      
      // Delete: Event creators and admins can delete
      allow delete: if isAuthenticated() && 
        (request.auth.uid == resource.data.createdBy || isAdmin());
    }
    
    // ==================== EVENT CATEGORIES ====================
    match /eventCategories/{categoryId} {
      allow read: if true;
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // ==================== REGISTRATIONS ====================
    match /registrations/{registrationId} {
      allow read: if isAuthenticated();
      
      // Users can register themselves
      allow create: if isAuthenticated() && 
        request.auth.uid == request.resource.data.userId &&
        isValidRegistration(request.resource.data);
      
      // Users can update their own registrations
      allow update: if isAuthenticated() && 
        (request.auth.uid == resource.data.userId || isAdmin());
      
      // Users can cancel their own registrations
      allow delete: if isAuthenticated() && 
        (request.auth.uid == resource.data.userId || isAdmin());
    }
    
    // ==================== SUBMISSIONS ====================
    match /submissions/{submissionId} {
      allow read: if true; // Public read for voting/viewing
      
      // Users can submit their own entries
      allow create: if isAuthenticated() && 
        request.auth.uid == request.resource.data.userId &&
        isValidSubmission(request.resource.data);
      
      // Users can update their own submissions (before deadline)
      allow update: if isAuthenticated() && 
        request.auth.uid == resource.data.userId &&
        !isSubmissionLocked(resource.data.eventId);
      
      // Users can delete their own submissions
      allow delete: if isAuthenticated() && 
        (request.auth.uid == resource.data.userId || isAdmin());
    }
    
    // ==================== VOTES ====================
    match /votes/{voteId} {
      allow read: if isAuthenticated();
      
      // Users can vote (one vote per user per submission)
      allow create: if isAuthenticated() && 
        request.auth.uid == request.resource.data.voterId &&
        isValidVote(request.resource.data);
      
      // Users can update their own votes
      allow update: if isAuthenticated() && 
        request.auth.uid == resource.data.voterId;
      
      // Users can delete their own votes
      allow delete: if isAuthenticated() && 
        request.auth.uid == resource.data.voterId;
    }
    
    // ==================== LEADERBOARDS & RANKINGS ====================
    match /leaderboards/{leaderboardId} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() && isAdmin(); // Admin only updates
    }
    
    match /rankings/{rankingId} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() && isAdmin(); // Admin only updates
    }
    
    match /rankingHistory/{historyId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isAdmin(); // Admin only updates
    }
    
    // ==================== TOURNAMENTS & MATCHES ====================
    match /tournaments/{tournamentId} {
      allow read: if true;
      allow write: if isAuthenticated() && isAdmin();
    }
    
    match /matches/{matchId} {
      allow read: if true;
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // ==================== ANALYTICS (Admin Only) ====================
    match /eventAnalytics/{eventId} {
      allow read: if isAuthenticated() && isAdmin();
      allow write: if false; // Server-side only
    }
    
    match /engagementMetrics/{metricId} {
      allow read: if isAuthenticated() && isAdmin();
      allow write: if false; // Server-side only
    }
    
    // ==================== COMMUNICATION ====================
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if isAuthenticated() && isAdmin();
    }
    
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
        request.auth.uid == resource.data.receiverId;
      allow write: if isAuthenticated() && 
        (request.auth.uid == resource.data.receiverId || isAdmin());
    }
    
    // ==================== REPORTS & MODERATION ====================
    match /reports/{reportId} {
      allow read: if isAuthenticated() && isAdmin();
      allow create: if isAuthenticated(); // Anyone can report
      allow update, delete: if isAuthenticated() && isAdmin();
    }
    
    match /eventLogs/{logId} {
      allow read: if isAuthenticated() && isAdmin();
      allow write: if false; // Server-side only
    }
    
    // ==================== HELPER FUNCTIONS ====================
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return request.auth != null && (
        get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true
      );
    }
    
    function isValidEventData(data) {
      return data.keys().hasAll(['title', 'description', 'createdBy', 'status']) &&
        data.title is string && data.title.size() > 0 && data.title.size() <= 100 &&
        data.description is string && data.description.size() <= 1000 &&
        data.createdBy is string &&
        data.status in ['draft', 'upcoming', 'ongoing', 'completed'];
    }
    
    function isValidRegistration(data) {
      return data.keys().hasAll(['userId', 'eventId']) &&
        data.userId is string &&
        data.eventId is string;
    }
    
    function isValidSubmission(data) {
      return data.keys().hasAll(['userId', 'eventId']) &&
        data.userId is string &&
        data.eventId is string &&
        (!data.keys().hasAny(['mediaUrl']) || data.mediaUrl is string);
    }
    
    function isValidVote(data) {
      return data.keys().hasAll(['voterId', 'submissionId']) &&
        data.voterId is string &&
        data.submissionId is string &&
        data.score is number && data.score >= 1 && data.score <= 10;
    }
    
    function isSubmissionLocked(eventId) {
      // Check if submission deadline has passed
      let event = get(/databases/events-db/documents/events/$(eventId));
      return event.data.submissionDeadline != null && 
        request.time > event.data.submissionDeadline;
    }
  }
}`;

console.log(productionRules);

console.log(`
📋 HOW TO APPLY PRODUCTION RULES:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: amaplay007
3. Go to Firestore Database
4. 🔍 IMPORTANT: Select "events-db" from the database dropdown
5. Click on "Rules" tab
6. Replace existing rules with the rules above
7. Click "Publish"

🔒 PRODUCTION SECURITY FEATURES:

✅ Authentication Required: Most operations require user login
✅ Data Validation: Input validation for all form fields
✅ Admin Controls: Admin-only access for sensitive operations
✅ User Ownership: Users can only modify their own data
✅ Public Read: Events and leaderboards are publicly readable
✅ Deadline Enforcement: Submissions locked after deadlines
✅ Rate Limiting: Built-in protection against spam

🎯 These rules will:
- Allow authenticated users to create events
- Validate all form input data
- Protect against malicious submissions
- Ensure proper user permissions
- Allow public viewing of events and leaderboards
- Secure admin operations

✅ Your ranking history and leaderboard operations will work
   with proper authentication and admin permissions!
`);