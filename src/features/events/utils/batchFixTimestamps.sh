#!/bin/bash

# Batch fix script for timestamp-related TypeScript errors
# This script adds the necessary imports to components that need timestamp helpers

echo "Adding timestamp helper imports to components..."

# List of files that need timestamp helpers
files=(
  "src/features/events/components/common/PersonalizedPerformanceReport.tsx"
  "src/features/events/components/common/UserInsightsDashboard.tsx"
  "src/features/events/components/common/ReactionDisplay.tsx"
  "src/features/events/components/common/StreakDisplay.tsx"
  "src/features/events/components/common/TeamManagement.tsx"
  "src/features/events/pages/EventDetailPage.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Add import if not already present
    if ! grep -q "timestampHelpers" "$file"; then
      # Find the last import line and add after it
      sed -i '' "/^import.*from/a\\
import { formatDate, formatTimeAgo, formatDaysAgo, timestampToDate } from '@features/events/utils/timestampHelpers';
" "$file" 2>/dev/null || sed -i "/^import.*from/a\\import { formatDate, formatTimeAgo, formatDaysAgo, timestampToDate } from '@features/events/utils/timestampHelpers';" "$file"
    fi
  fi
done

echo "Done! Please review the changes and update component code to use the helpers."
