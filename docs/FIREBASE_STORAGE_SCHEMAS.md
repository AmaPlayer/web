# AmaPlayer - Firebase Storage Architecture

## Storage Bucket Structure

### Folder Organization
```
├── profile-images/
│   ├── {userId}/
│   │   ├── avatar.jpg
│   │   ├── cover.jpg
│   │   └── thumbnails/
│   │       ├── avatar_150x150.jpg
│   │       └── cover_800x300.jpg
│   └── {userId2}/...
│
├── posts/
│   ├── images/
│   │   ├── {userId}/
│   │   │   ├── {timestamp}-{filename}.jpg
│   │   │   └── thumbnails/
│   │   │       └── {timestamp}-{filename}_thumb.jpg
│   │   └── {userId2}/...
│   └── videos/
│       ├── {userId}/
│       │   ├── {timestamp}-{filename}.mp4
│       │   └── thumbnails/
│       │       └── {timestamp}-{filename}_thumb.jpg
│       └── {userId2}/...
│
├── stories/
│   ├── images/
│   │   ├── {userId}/
│   │   │   └── {timestamp}-{filename}.jpg
│   │   └── {userId2}/...
│   └── videos/
│       ├── {userId}/
│       │   ├── {timestamp}-{filename}.mp4
│       │   └── thumbnails/
│       │       └── {timestamp}-{filename}_thumb.jpg
│       └── {userId2}/...
│
├── post-videos/
│   ├── {userId}/
│   │   ├── {timestamp}-{filename}.mp4
│   │   ├── {timestamp}-{filename}_thumbnail.jpg
│   │   └── processed/
│   │       ├── {timestamp}-{filename}_720p.mp4
│   │       ├── {timestamp}-{filename}_480p.mp4
│   │       └── {timestamp}-{filename}_360p.mp4
│   └── {userId2}/...
│
├── athlete-highlights/
│   ├── {userId}/
│   │   ├── {timestamp}-{title}.mp4
│   │   ├── {timestamp}-{title}_thumbnail.jpg
│   │   └── metadata/
│   │       └── {timestamp}-{title}.json
│   └── {userId2}/...
│
├── training-sessions/
│   ├── {userId}/
│   │   ├── {date}-{session_type}.mp4
│   │   ├── {date}-{session_type}_thumbnail.jpg
│   │   └── analytics/
│   │       └── {date}-{session_type}_data.json
│   └── {userId2}/...
│
├── competitions/
│   ├── {userId}/
│   │   ├── {date}-{competition_name}.mp4
│   │   ├── {date}-{competition_name}_thumbnail.jpg
│   │   └── results/
│   │       └── {date}-{competition_name}_results.json
│   └── {userId2}/...
│
├── messages/
│   ├── {userId1}/
│   │   ├── {userId2}/
│   │   │   ├── {timestamp}-{filename}.jpg
│   │   │   ├── {timestamp}-{filename}.mp4
│   │   │   └── {timestamp}-{filename}.pdf
│   │   └── {userId3}/...
│   └── {userId2}/...
│
├── comments/
│   ├── {commentId}/
│   │   ├── {timestamp}-{filename}.jpg
│   │   └── {timestamp}-{filename}.mp4
│   └── {commentId2}/...
│
├── groups/
│   ├── {groupId}/
│   │   ├── {userId}/
│   │   │   ├── {timestamp}-{filename}.jpg
│   │   │   └── {timestamp}-{filename}.mp4
│   │   └── {userId2}/...
│   └── {groupId2}/...
│
├── events/
│   ├── videos/
│   │   ├── {eventId}/
│   │   │   ├── {videoId}.mp4
│   │   │   └── processed/
│   │   │       ├── {videoId}_720p.mp4
│   │   │       └── {videoId}_480p.mp4
│   │   └── {eventId2}/...
│   ├── thumbnails/
│   │   ├── {eventId}/
│   │   │   ├── {thumbnailId}.jpg
│   │   │   └── {thumbnailId}_small.jpg
│   │   └── {eventId2}/...
│   └── submissions/
│       ├── {challengeId}/
│       │   ├── {userId}/
│       │   │   ├── {submissionId}.mp4
│       │   │   └── {submissionId}_thumbnail.jpg
│       │   └── {userId2}/...
│       └── {challengeId2}/...
│
└── temp/
    ├── {userId}/
    │   ├── processing_queue/
    │   │   ├── {upload_id}-{filename}.mp4
    │   │   └── {upload_id}-metadata.json
    │   └── failed_uploads/
    │       └── {timestamp}-{filename}.tmp
    └── {userId2}/...
```

## File Naming Conventions

### Standard Format
```
{timestamp}-{sanitized_filename}.{extension}
```

### Examples
```javascript
// Profile images
"profile-images/user123/1234567890-avatar.jpg"
"profile-images/user123/thumbnails/1234567890-avatar_150x150.jpg"

// Post media
"posts/images/user123/1234567890-training_session.jpg"
"posts/videos/user123/1234567890-basketball_highlights.mp4"

// Stories
"stories/images/user123/1234567890-workout_selfie.jpg"
"stories/videos/user123/1234567890-practice_session.mp4"

// Messages
"messages/user123/user456/1234567890-screenshot.jpg"

// Comments
"comments/comment789/1234567890-reaction_gif.gif"

// Events
"events/videos/event123/video456.mp4"
"events/thumbnails/event123/thumb789.jpg"
"events/submissions/challenge456/user123/submission789.mp4"
```

## File Size Limits

### By Content Type
```javascript
const FILE_SIZE_LIMITS = {
  // Images
  "image/jpeg": 10 * 1024 * 1024,      // 10MB
  "image/png": 10 * 1024 * 1024,       // 10MB
  "image/gif": 10 * 1024 * 1024,       // 10MB
  "image/webp": 10 * 1024 * 1024,      // 10MB
  
  // Videos
  "video/mp4": 100 * 1024 * 1024,      // 100MB
  "video/mov": 100 * 1024 * 1024,      // 100MB
  "video/avi": 100 * 1024 * 1024,      // 100MB
  "video/webm": 100 * 1024 * 1024,     // 100MB
  
  // Audio
  "audio/mp3": 50 * 1024 * 1024,       // 50MB
  "audio/wav": 50 * 1024 * 1024,       // 50MB
  "audio/m4a": 50 * 1024 * 1024,       // 50MB
  
  // Documents
  "application/pdf": 25 * 1024 * 1024,  // 25MB
  "text/plain": 5 * 1024 * 1024,       // 5MB
  "application/msword": 25 * 1024 * 1024 // 25MB
};
```

### By Use Case
```javascript
const USE_CASE_LIMITS = {
  profileImages: 5 * 1024 * 1024,      // 5MB
  postImages: 10 * 1024 * 1024,        // 10MB
  postVideos: 100 * 1024 * 1024,       // 100MB
  storyMedia: 50 * 1024 * 1024,        // 50MB
  messageAttachments: 25 * 1024 * 1024, // 25MB
  commentMedia: 10 * 1024 * 1024,      // 10MB
  athleteHighlights: 200 * 1024 * 1024, // 200MB (premium content)
  trainingVideos: 500 * 1024 * 1024,   // 500MB (professional use)
  eventVideos: 50 * 1024 * 1024,       // 50MB (event content)
  eventThumbnails: 5 * 1024 * 1024,    // 5MB (event thumbnails)
  challengeSubmissions: 50 * 1024 * 1024 // 50MB (challenge videos)
};
```

## Supported File Types

### Images
```javascript
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
];
```

### Videos
```javascript
const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/avi', 
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv',
  'video/m4v'
];
```

### Audio
```javascript
const SUPPORTED_AUDIO_TYPES = [
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/aac'
];
```

### Documents
```javascript
const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
```

## Security Rules

### Path-Based Permissions
```javascript
// Users can only upload to their own directories
match /posts/images/{userId}/{fileName} {
  allow write: if request.auth.uid == userId;
}

// Stories have 24-hour expiry
match /stories/{mediaType}/{userId}/{fileName} {
  allow write: if request.auth.uid == userId;
  allow read: if true; // Public read access
}

// Messages require sender/receiver validation
match /messages/{userId1}/{userId2}/{fileName} {
  allow write: if request.auth.uid == userId1 || request.auth.uid == userId2;
  allow read: if request.auth.uid == userId1 || request.auth.uid == userId2;
}

// Event videos - authenticated users can upload
match /events/videos/{eventId}/{videoId}.mp4 {
  allow read: if true; // Public read access
  allow write: if request.auth != null && validateEventVideoFile();
}

// Event thumbnails - authenticated users can upload
match /events/thumbnails/{eventId}/{thumbnailId}.jpg {
  allow read: if true; // Public read access
  allow write: if request.auth != null && validateEventThumbnailFile();
}

// Challenge submissions - users can only upload their own
match /events/submissions/{challengeId}/{userId}/{submissionId}.mp4 {
  allow read: if true; // Public read access
  allow write: if request.auth.uid == userId && validateEventVideoFile();
}
```

### File Validation
```javascript
function validateImageFile() {
  return request.resource.size < 10 * 1024 * 1024 // 10MB
    && request.resource.contentType.matches('image/.*')
    && request.resource.contentType in SUPPORTED_IMAGE_TYPES;
}

function validateVideoFile() {
  return request.resource.size < 100 * 1024 * 1024 // 100MB
    && request.resource.contentType.matches('video/.*')
    && request.resource.contentType in SUPPORTED_VIDEO_TYPES;
}

function validateEventVideoFile() {
  return request.resource.size < 50 * 1024 * 1024 // 50MB for event videos
    && request.resource.contentType.matches('video/.*')
    && request.resource.contentType in SUPPORTED_VIDEO_TYPES;
}

function validateEventThumbnailFile() {
  return request.resource.size < 5 * 1024 * 1024 // 5MB for event thumbnails
    && request.resource.contentType.matches('image/.*')
    && request.resource.contentType in SUPPORTED_IMAGE_TYPES;
}
```

## Metadata Storage

### Image Metadata
```javascript
{
  url: "https://storage.googleapis.com/...",
  type: "image",
  mimeType: "image/jpeg",
  size: 2048000, // bytes
  dimensions: {
    width: 1080,
    height: 1080
  },
  uploadedAt: "2024-01-15T10:30:00Z",
  uploadedBy: "user_12345",
  fileName: "training_session.jpg",
  path: "posts/images/user123/1234567890-training_session.jpg",
  thumbnails: {
    small: "https://storage.googleapis.com/.../thumb_150.jpg",
    medium: "https://storage.googleapis.com/.../thumb_300.jpg",
    large: "https://storage.googleapis.com/.../thumb_800.jpg"
  },
  colors: {
    dominant: "#4A90E2",
    palette: ["#4A90E2", "#F5A623", "#D0021B"]
  },
  hash: "sha256:1234567890abcdef...", // For duplicate detection
  contentAnalysis: {
    hasText: false,
    hasFaces: true,
    isAppropriate: true,
    confidence: 0.95
  }
}
```

### Video Metadata
```javascript
{
  url: "https://storage.googleapis.com/...",
  type: "video", 
  mimeType: "video/mp4",
  size: 52428800, // bytes (50MB)
  duration: 125.5, // seconds
  dimensions: {
    width: 1920,
    height: 1080
  },
  frameRate: 30,
  bitrate: 5000000, // bits per second
  uploadedAt: "2024-01-15T10:30:00Z",
  uploadedBy: "user_12345",
  fileName: "basketball_highlights.mp4",
  path: "posts/videos/user123/1234567890-basketball_highlights.mp4",
  thumbnail: "https://storage.googleapis.com/.../thumbnail.jpg",
  previews: [
    "https://storage.googleapis.com/.../preview_360p.mp4",
    "https://storage.googleapis.com/.../preview_720p.mp4"
  ],
  audioTrack: {
    hasAudio: true,
    duration: 125.5,
    bitrate: 128000,
    sampleRate: 44100
  },
  processing: {
    status: "completed", // uploading | processing | completed | failed
    thumbnailGenerated: true,
    previewsGenerated: true,
    compressionApplied: true
  },
  analytics: {
    views: 0,
    totalWatchTime: 0,
    averageWatchPercentage: 0
  }
}
```

## Content Processing Pipeline

### Image Processing
1. **Upload** → Original file stored
2. **Validation** → Check file type, size, content
3. **Thumbnail Generation** → Multiple sizes (150px, 300px, 800px)
4. **Optimization** → Compress for web delivery
5. **Content Analysis** → Check for inappropriate content
6. **Metadata Extraction** → Dimensions, colors, etc.

### Video Processing  
1. **Upload** → Original file stored
2. **Validation** → Check file type, size, duration
3. **Thumbnail Generation** → Extract frame at 1 second
4. **Preview Generation** → Create compressed previews (360p, 720p)
5. **Audio Extraction** → Separate audio track if needed
6. **Content Analysis** → Check for inappropriate content
7. **Metadata Extraction** → Duration, dimensions, bitrate, etc.

## Storage Optimization

### Automatic Cleanup
```javascript
// Stories cleanup (after 24 hours)
const CLEANUP_JOBS = {
  expiredStories: {
    schedule: "every 1 hours",
    query: "stories WHERE expiresAt < NOW() AND isHighlight = false",
    action: "delete_file_and_document"
  },
  
  // Temporary files cleanup
  tempFiles: {
    schedule: "every 6 hours", 
    query: "temp/ WHERE uploadedAt < NOW() - 24 hours",
    action: "delete_file"
  },
  
  // Failed uploads cleanup
  failedUploads: {
    schedule: "daily",
    query: "temp/*/failed_uploads/ WHERE createdAt < NOW() - 7 days",
    action: "delete_file"
  }
};
```

### Compression Settings
```javascript
const COMPRESSION_SETTINGS = {
  images: {
    jpeg: { quality: 85, progressive: true },
    png: { compressionLevel: 6 },
    webp: { quality: 80, lossless: false }
  },
  videos: {
    mp4: { 
      crf: 23, // Constant Rate Factor
      preset: "medium",
      maxBitrate: "5M"
    }
  }
};
```

## CDN Integration

### Firebase Storage CDN
- **Global Distribution**: Files served from nearest edge location
- **Automatic Caching**: 1 hour cache for images, 24 hours for videos
- **Bandwidth Optimization**: Automatic format conversion (WebP for supported browsers)
- **Security**: Signed URLs for private content

### Custom Domain
```
https://media.amaplayer.app/
├── images/ (alias to storage bucket)
├── videos/ (alias to storage bucket)
└── static/ (static assets)
```

## Monitoring & Analytics

### Storage Metrics
- **Total Storage Used**: By user, by content type
- **Upload Success Rate**: Percentage of successful uploads
- **Average Upload Time**: By file size and type
- **Popular Content**: Most accessed files
- **Storage Growth**: Daily/monthly storage usage trends

### Performance Metrics
- **Download Speed**: Average download time by region
- **CDN Hit Rate**: Percentage of requests served from cache
- **Error Rates**: Upload/download failure rates
- **User Experience**: Time to first byte, total load time

This storage architecture ensures scalable, secure, and performant media handling for the AmaPlayer social sports platform.