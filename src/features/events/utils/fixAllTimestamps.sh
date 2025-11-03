#!/bin/bash

# This script fixes all Timestamp-related TypeScript errors in the events feature
# by replacing Date objects with Firebase Timestamp objects

echo "Fixing Timestamp errors in events feature..."

# Fix mentorshipSystem.ts
echo "Fixing mentorshipSystem.ts..."
sed -i '' 's/requestedAt: new Date()/requestedAt: Timestamp.now()/g' ../services/mentorshipSystem.ts
sed -i '' 's/startDate: new Date()/startDate: Timestamp.now()/g' ../services/mentorshipSystem.ts
sed -i '' 's/date: new Date()/date: Timestamp.now()/g' ../services/mentorshipSystem.ts
sed -i '' 's/endDate: new Date()/endDate: Timestamp.now()/g' ../services/mentorshipSystem.ts

# Fix progressTracker.ts
echo "Fixing progressTracker.ts..."
sed -i '' 's/lastUpdated: new Date()/lastUpdated: Timestamp.now()/g' ../services/progressTracker.ts
sed -i '' 's/lastUpdated: now/lastUpdated: Timestamp.now()/g' ../services/progressTracker.ts

# Fix reactionSystem.ts
echo "Fixing reactionSystem.ts..."
sed -i '' 's/timestamp: new Date()/timestamp: Timestamp.now()/g' ../services/reactionSystem.ts

# Fix recommendationService.ts
echo "Fixing recommendationService.ts..."
sed -i '' 's/generatedAt: new Date()/generatedAt: Timestamp.now()/g' ../services/recommendationService.ts

# Fix statisticsService.ts
echo "Fixing statisticsService.ts..."
sed -i '' 's/generatedAt: new Date()/generatedAt: Timestamp.now()/g' ../services/statisticsService.ts

# Fix teamSystem.ts
echo "Fixing teamSystem.ts..."
sed -i '' 's/createdAt: new Date()/createdAt: Timestamp.now()/g' ../services/teamSystem.ts
sed -i '' 's/earnedAt: new Date()/earnedAt: Timestamp.now()/g' ../services/teamSystem.ts

# Fix webSocketService.ts
echo "Fixing webSocketService.ts..."
sed -i '' 's/connectedAt: new Date()/connectedAt: Timestamp.now()/g' ../services/webSocketService.ts
sed -i '' 's/lastActivity: new Date()/lastActivity: Timestamp.now()/g' ../services/webSocketService.ts
sed -i '' 's/timestamp: new Date()/timestamp: Timestamp.now()/g' ../services/webSocketService.ts

# Fix challengeSystem.ts
echo "Fixing challengeSystem.ts..."

# Fix UserInsightsDashboard.tsx
echo "Fixing UserInsightsDashboard.tsx..."
sed -i '' 's/insights\.generatedAt\.toLocaleDateString()/formatTimestampDate(insights.generatedAt)/g' ../components/common/UserInsightsDashboard.tsx
sed -i '' 's/goal\.deadline\.toLocaleDateString()/formatTimestampDate(goal.deadline)/g' ../components/common/UserInsightsDashboard.tsx
sed -i '' 's/achievement\.estimatedDate\.toLocaleDateString()/formatTimestampDate(achievement.estimatedDate)/g' ../components/common/UserInsightsDashboard.tsx

echo "Done! Please review the changes and run TypeScript compiler to verify."
