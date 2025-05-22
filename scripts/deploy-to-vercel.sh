#!/bin/bash

# Vercel deployment script for TuriCheck
# This script helps deploy the frontend to Vercel

# Set script to exit on error
set -e

echo "🚀 Starting TuriCheck Vercel deployment..."

# Ensure we're in the repo root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "/Users/coledermott/TuriCheck")
cd "$REPO_ROOT"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not found. Installing..."
  npm install -g vercel
fi

# Check if user is logged in to Vercel
vercel whoami &> /dev/null || {
  echo "⚠️ Not logged in to Vercel. Please login:"
  vercel login
}

echo "✅ Vercel CLI is ready"

# Navigate to the frontend directory
cd apps/frontend

# Ensure we have a simplified vercel.json
echo '{
  "framework": "nextjs",
  "buildCommand": "yarn build",
  "installCommand": "yarn install",
  "outputDirectory": ".next"
}' > vercel.json

echo "✅ Created simplified vercel.json"

# Create a production deployment
echo "🔧 Deploying to Vercel..."
vercel --prod --yes

echo "🎉 Deployment initiated!"
echo ""
echo "⚠️ IMPORTANT: Make sure to set the following environment variables in your Vercel project:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- NEXT_PUBLIC_AI_API_KEY"
echo "- NEXT_PUBLIC_AI_API_URL"
echo "- NEXT_PUBLIC_AI_MODEL"
echo "- NEXT_PUBLIC_PACKAGE_ID"
echo "- NEXT_PUBLIC_SUI_NETWORK"
echo ""
echo "Visit your Vercel dashboard to monitor the deployment progress and set environment variables."