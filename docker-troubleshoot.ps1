# Docker Troubleshooting Script
# This script helps diagnose and fix common Docker issues

Write-Host "🔧 Docker Troubleshooting for Creator AI Studio" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "🔍 Select troubleshooting option:" -ForegroundColor Cyan
Write-Host "1. Full system reset (clean everything and restart)" -ForegroundColor White
Write-Host "2. Fix database schema issues" -ForegroundColor White
Write-Host "3. Restart only the application container" -ForegroundColor White
Write-Host "4. View detailed error logs" -ForegroundColor White
Write-Host "5. Check port conflicts" -ForegroundColor White
Write-Host "6. Fix Docker credentials" -ForegroundColor White
Write-Host "7. Test database manually" -ForegroundColor White
Write-Host "8. Check system resources" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-8)"

switch ($choice) {
    "1" {
        Write-Host "🧹 Full system reset..." -ForegroundColor Yellow
        Write-Host "⚠️  This will delete all containers, volumes, and data!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            docker-compose -f docker-compose.dev.yml down -v --remove-orphans
            docker system prune -af
            docker volume prune -f
            Write-Host "✅ System cleaned. Run .\docker-setup-complete.ps1 to restart" -ForegroundColor Green
        } else {
            Write-Host "❌ Reset cancelled" -ForegroundColor Yellow
        }
    }
    "2" {
        Write-Host "🗄️  Fixing database schema..." -ForegroundColor Yellow
        docker exec creator-ai-postgres-dev psql -U postgres -d creators_dev_db -f /docker-entrypoint-initdb.d/init.sql
        docker-compose -f docker-compose.dev.yml restart app-dev
        Write-Host "✅ Database schema updated and app restarted" -ForegroundColor Green
    }
    "3" {
        Write-Host "🔄 Restarting application container..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml restart app-dev
        Start-Sleep 5
        Write-Host "✅ Application container restarted" -ForegroundColor Green
        Write-Host "🧪 Testing health..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 10
            Write-Host "✅ Application is healthy!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Application health check failed" -ForegroundColor Red
        }
    }
    "4" {
        Write-Host "📋 Detailed error logs:" -ForegroundColor Yellow
        Write-Host "========================" -ForegroundColor Yellow
        Write-Host "🔍 Application errors:" -ForegroundColor Cyan
        docker logs creator-ai-app-dev --tail 50 | Select-String -Pattern "error|Error|ERROR|fail|Fail|FAIL"
        Write-Host ""
        Write-Host "🔍 Database errors:" -ForegroundColor Cyan
        docker logs creator-ai-postgres-dev --tail 20 | Select-String -Pattern "error|Error|ERROR|fail|Fail|FAIL"
    }
    "5" {
        Write-Host "🔍 Checking port conflicts..." -ForegroundColor Yellow
        $ports = @(5000, 5432, 6379, 5173)
        foreach ($port in $ports) {
            $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "⚠️  Port $port is in use by process ID: $($process.OwningProcess)" -ForegroundColor Yellow
            } else {
                Write-Host "✅ Port $port is available" -ForegroundColor Green
            }
        }
    }
    "6" {
        Write-Host "🔧 Fixing Docker credentials..." -ForegroundColor Yellow
        $dockerConfigDir = "$env:USERPROFILE\.docker"
        if (!(Test-Path $dockerConfigDir)) {
            New-Item -ItemType Directory -Path $dockerConfigDir -Force | Out-Null
        }
        
        $configContent = @"
{
  "auths": {},
  "credsStore": ""
}
"@
        $configContent | Out-File -FilePath "$dockerConfigDir\config.json" -Encoding UTF8 -Force
        Write-Host "✅ Docker credentials fixed" -ForegroundColor Green
    }
    "7" {
        Write-Host "🗄️  Testing database manually..." -ForegroundColor Yellow
        Write-Host "📋 Database connection test:" -ForegroundColor Cyan
        docker exec creator-ai-postgres-dev psql -U postgres -d creators_dev_db -c "SELECT version();"
        Write-Host ""
        Write-Host "📋 Tables in database:" -ForegroundColor Cyan
        docker exec creator-ai-postgres-dev psql -U postgres -d creators_dev_db -c "\dt"
        Write-Host ""
        Write-Host "📋 User count:" -ForegroundColor Cyan
        docker exec creator-ai-postgres-dev psql -U postgres -d creators_dev_db -c "SELECT COUNT(*) FROM users;"
    }
    "8" {
        Write-Host "📊 System resources:" -ForegroundColor Yellow
        Write-Host "=====================" -ForegroundColor Yellow
        Write-Host "🐳 Docker system info:" -ForegroundColor Cyan
        docker system df
        Write-Host ""
        Write-Host "📊 Container resource usage:" -ForegroundColor Cyan
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" creator-ai-app-dev creator-ai-postgres-dev creator-ai-redis-dev 2>$null
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 Common Solutions:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "• If containers won't start: Run option 1 (full reset)" -ForegroundColor White
Write-Host "• If database errors: Run option 2 (fix schema)" -ForegroundColor White
Write-Host "• If app won't respond: Run option 3 (restart app)" -ForegroundColor White
Write-Host "• If port conflicts: Run option 5 (check ports)" -ForegroundColor White
Write-Host "• For detailed help: .\docker-debug.ps1" -ForegroundColor White