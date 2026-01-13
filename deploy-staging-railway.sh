#!/bin/bash
set -e

echo "🚀 Deploying to Railway staging environment..."

# Check if RAILWAY_TOKEN is set
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ Error: RAILWAY_TOKEN environment variable is not set"
    echo "Please set it in your GitHub secrets or environment"
    exit 1
fi

echo "🔐 Railway authentication configured via environment variable"

# Verify Railway CLI authentication
echo "🔍 Verifying Railway CLI authentication..."
railway whoami || echo "⚠️ Railway authentication check failed, but continuing with token..."

echo "🔗 Linking to Railway project and service..."

# Link to project using the correct flag syntax
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f

echo "📦 Starting deployment to staging..."

# Deploy to specific service in staging environment
railway up --service 01abc727-2496-4948-95e7-c05f629936e8

echo "✅ Deployment initiated successfully!"
echo "🌐 Check your Railway dashboard for deployment status"
