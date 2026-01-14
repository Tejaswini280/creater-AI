Write-Host "🔧 FIXING DOCKER STARTUP ISSUE" -ForegroundColor Cyan

# Stop the problematic container
docker stop creator-ai-app
docker rm creator-ai-app

# Start with a simple command override to keep it running
docker run -d --name creator-ai-app --network creatornexus_creator-ai-network -p 5000:5000 -e NODE_ENV=development -e DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/creators_dev_db -e REDIS_URL=redis://redis:6379 -e PORT=5000 -e JWT_SECRET=CreatorNexus-JWT-Secret-2024-Development -e JWT_REFRESH_SECRET=CreatorNexus-Refresh-Secret-2024-Development -e SESSION_SECRET=CreatorNexus-Dev-Secret-2024-Change-In-Production -e SKIP_RATE_LIMIT=1 -e PERF_MODE=0 -e SECURE_COOKIES=false -e TRUST_PROXY=false --env-file .env.development creatornexus-app sh -c "cd /app && NODE_ENV=development node dist/index.js"

Write-Host "✅ Container restarted with fixed startup command" -ForegroundColor Green
Write-Host "🌐 Application should be available at: http://localhost:5000" -ForegroundColor Cyan

# Wait a moment and check logs
Start-Sleep -Seconds 5
docker logs creator-ai-app --tail 20