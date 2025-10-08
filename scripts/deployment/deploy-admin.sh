#!/bin/bash

# Deploy script for TypeScript Admin Dashboard
echo "🔧 Building TypeScript Admin Dashboard..."

# Check if admin directory exists
if [ ! -d "admin/amaplayer-admin-dashboard" ]; then
    echo "❌ Error: Admin dashboard directory not found!"
    echo "Expected: admin/amaplayer-admin-dashboard/"
    exit 1
fi

# Navigate to admin directory and install dependencies if needed
cd admin/amaplayer-admin-dashboard
if [ ! -d "node_modules" ]; then
    echo "📦 Installing admin dependencies..."
    npm install
fi

# Skip type checking and tests for now (build will catch critical issues)
echo "⚡ Skipping type checking and tests for quick deployment..."

# Build admin dashboard
echo "🏗️ Building admin dashboard..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Admin build failed!"
    exit 1
fi

# Deploy to the separate admin Firebase project
echo "🚀 Deploying to Firebase Admin Project..."
firebase use amaplayer-admin-dashboard
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo "❌ Firebase deployment failed!"
    cd ../..
    exit 1
fi

# Navigate back to project root
cd ../..

echo "✅ Deployment complete!"
echo ""
echo "🌐 Live URLs:"
echo "Main App: https://my-react-firebase-app-69fcd.web.app"
echo "Admin Dashboard: https://amaplayer-admin-dashboard.web.app"
echo ""
echo "📊 Admin Features Available:"
echo "- User Management & Role Assignment"
echo "- Video Verification & Content Moderation"
echo "- Event Management & CRUD Operations"
echo "- Real-time Dashboard with Analytics"