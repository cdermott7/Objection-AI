#!/bin/bash

# Prepare TuriCheck for Vercel deployment
# This script prepares the frontend for deployment via Vercel UI

# Set script to exit on error
set -e

echo "🚀 Preparing TuriCheck for Vercel deployment..."

# Ensure we're in the repo root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "/Users/coledermott/TuriCheck")
cd "$REPO_ROOT"

# Navigate to the frontend directory
cd apps/frontend

# Ensure we have a proper next.config.js (not .ts)
echo "/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [\"@mysten/sui.js\"],
  experimental: {
    esmExternals: 'loose'
  }
};

module.exports = nextConfig;" > next.config.js

echo "✅ Created compatible next.config.js"

# Update package.json to use stable Next.js and React versions
sed -i.bak 's/"next": "15.3.2"/"next": "14.0.4"/g' package.json
sed -i.bak 's/"react": "\^19.0.0"/"react": "18.2.0"/g' package.json
sed -i.bak 's/"react-dom": "\^19.0.0"/"react-dom": "18.2.0"/g' package.json
rm package.json.bak

echo "✅ Updated package.json with stable Next.js and React versions"

# Create a simple vercel.json
echo '{
  "framework": "nextjs",
  "buildCommand": "yarn build",
  "installCommand": "yarn install",
  "outputDirectory": ".next"
}' > vercel.json

echo "✅ Created simplified vercel.json"

# Remind about the Vercel UI deployment
echo ""
echo "🎉 Your project is now ready for Vercel deployment!"
echo ""
echo "👉 Follow these steps to deploy using the Vercel UI:"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Configure the project settings:"
echo "   - Framework Preset: Next.js"
echo "   - Root Directory: apps/frontend"
echo "   - Build Command: yarn build"
echo "   - Install Command: yarn install"
echo "   - Output Directory: .next"
echo ""
echo "4. Set these environment variables:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - NEXT_PUBLIC_AI_API_KEY"
echo "   - NEXT_PUBLIC_AI_API_URL"
echo "   - NEXT_PUBLIC_AI_MODEL"
echo "   - NEXT_PUBLIC_PACKAGE_ID"
echo "   - NEXT_PUBLIC_SUI_NETWORK"
echo ""
echo "5. Click 'Deploy'"
echo ""
echo "📘 For more detailed instructions, see: VERCEL_DEPLOYMENT.md"