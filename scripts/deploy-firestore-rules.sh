#!/bin/bash

# Deploy Firestore Security Rules
# This script deploys the Firestore security rules to Firebase

set -e

echo "🔐 Deploying Firestore Security Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI is not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found"
    echo "Make sure you're running this script from the web directory"
    exit 1
fi

# Check if firestore.rules exists
if [ ! -f "storage-rules/firestore.rules" ]; then
    echo "❌ Error: storage-rules/firestore.rules not found"
    exit 1
fi

echo "📋 Firestore rules file: storage-rules/firestore.rules"
echo ""

# Deploy only Firestore rules
echo "🚀 Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore security rules deployed successfully!"
    echo ""
    echo "📝 Rules deployed include:"
    echo "  - Events collection rules"
    echo "  - Participations collection rules"
    echo "  - Achievements collection rules"
    echo "  - Leaderboards collection rules"
    echo "  - Challenges collection rules"
    echo "  - Event Stats subcollection rules"
    echo ""
    echo "🔍 You can verify the rules in the Firebase Console:"
    echo "   https://console.firebase.google.com/project/_/firestore/rules"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
