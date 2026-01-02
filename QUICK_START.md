# CreatorNexus - Quick Start Guide

## 🚀 One-Click Start

### Windows (Double-click)
- **Start**: `start-app.bat`
- **Stop**: `stop-app.bat`

### PowerShell
```powershell
# Start application
.\run-app.ps1

# Stop application
.\stop-app.ps1
```

## 📋 Common Commands

### Basic Operations
```powershell
# Start with default settings
.\run-app.ps1

# Start with verbose logging
.\run-app.ps1 -Verbose

# Stop application
.\stop-app.ps1

# Force stop everything
.\stop-app.ps1 -Force -StopDatabase
```

### Advanced Options
```powershell
# Skip database startup (if already running)
.\run-app.ps1 -SkipDatabase

# Skip port checking (don't stop existing processes)
.\run-app.ps1 -SkipPortCheck

# Set production environment
.\run-app.ps1 -Environment production
```

## 🌐 Access URLs

Once started:
- **Application**: http://localhost:5000
- **WebSocket**: ws://localhost:5000/ws
- **API**: http://localhost:5000/api/*

## 🔧 Troubleshooting

### Quick Fixes
```powershell
# Clear ports manually
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Restart PostgreSQL
Restart-Service postgresql*

# Clear npm cache
npm cache clean --force
```

### Debug Mode
```powershell
# Enable verbose logging
.\run-app.ps1 -Verbose
```

## 📊 Status Check

The scripts automatically show:
- ✅ Application status
- ✅ Database status
- ✅ Port availability
- ✅ Process health

## 🚨 Emergency Stop

```powershell
# Kill all processes immediately
.\stop-app.ps1 -Force -StopDatabase

# Manual emergency stop
taskkill /F /IM node.exe
Stop-Service postgresql*
```

## 📝 Logs

- **Location**: `./logs/`
- **Format**: `app-YYYYMMDD-HHMMSS.log`
- **View recent**: Check console output

---

**Need help?** See `RUN_APP_README.md` for detailed documentation. 