#!/bin/bash
# Bash script to run the app on port 5000

echo "🚀 Starting CreatorAI Studio on port 5000..."

# Set environment variables
export NODE_ENV="development"
export PORT="5000"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server (which includes both frontend and backend on port 5000)
echo "🌐 Starting server on port 5000..."
echo "📍 App will be available at: http://localhost:5000"
echo "🔧 Press Ctrl+C to stop the server"
echo ""

npm run dev
