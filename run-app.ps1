# run-app.ps1
# Windows PowerShell script to start the application and dependencies.
# - Idempotent: kills existing processes on service ports before starting
# - Starts services in parallel and writes logs to the /logs directory
# - Works with npm and yarn by auto-detecting the package manager
# - NOTE: This repository serves frontend and backend via a single server on port 5000.
#         We still free port 3000 (commonly used for backends) to avoid conflicts.

param(
  [switch]$NoKill
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve repo root (directory where this script resides)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Ensure logs directory exists
$LogsDir = Join-Path $ScriptDir 'logs'
if (-not (Test-Path $LogsDir)) {
  New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
}

function Write-Info([string]$Message) {
  $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  Write-Host "[$ts] $Message"
}

function Get-PIDsOnPort([int]$Port) {
  # Prefer Get-NetTCPConnection (PS 5+). Fallback to netstat parsing.
  try {
    $conns = @(Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue)
    if ($conns -and $conns.Count -gt 0) {
      return ($conns | Select-Object -ExpandProperty OwningProcess -Unique)
    }
  } catch {
    # Ignore and fallback to netstat
  }

  $pids = @()
  $netstat = & netstat -ano -p tcp 2>$null | Select-String -Pattern ":$Port\s"
  foreach ($line in $netstat) {
    $m = [regex]::Match($line.Line, "\s+(\d+)\s*$")
    if ($m.Success) { $pids += [int]$m.Groups[1].Value }
  }
  return ($pids | Sort-Object -Unique)
}

function Stop-ProcessesOnPorts([int[]]$Ports) {
  foreach ($port in $Ports) {
    $pids = @(Get-PIDsOnPort -Port $port)
    if ($pids.Count -gt 0) {
      Write-Info "Stopping processes on port ${port}: $($pids -join ', ')"
      foreach ($processId in $pids) {
        try {
          # First try graceful, then force
          Stop-Process -Id $processId -ErrorAction SilentlyContinue
          Start-Sleep -Milliseconds 250
          if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
            & taskkill /PID $processId /F 2>$null 1>$null
          }
        } catch {
          try { & taskkill /PID $processId /F 2>$null 1>$null } catch {}
        }
      }
    } else {
      Write-Info "No process found on port $port"
    }
  }
}

function Detect-PackageManager {
  if (Test-Path (Join-Path $ScriptDir 'yarn.lock')) { return 'yarn' }
  elseif (Test-Path (Join-Path $ScriptDir 'pnpm-lock.yaml')) { return 'pnpm' }
  else { return 'npm' }
}

function Build-DevCommand([string]$PackageManager) {
  switch ($PackageManager) {
    'yarn' { return 'yarn dev' }
    'pnpm' { return 'pnpm dev' }
    default { return 'npm run dev' }
  }
}

function Start-LoggedProcess {
  param(
    [Parameter(Mandatory=$true)][string]$Name,
    [Parameter(Mandatory=$true)][string]$CommandLine,
    [Parameter(Mandatory=$true)][string]$LogPathPrimary,
    [string]$LogPathSecondary,
    [string]$WorkingDirectory = $ScriptDir,
    [hashtable]$EnvVars
  )

  $log1 = $LogPathPrimary
  $log2 = $LogPathSecondary
  $wd = $WorkingDirectory

  # Create a temporary script to execute the command with proper logging, avoiding quoting issues
  $tmpScript = Join-Path $LogsDir ("start-" + $Name + "-" + [Guid]::NewGuid().ToString('N') + ".ps1")
  $scriptLines = @()
  $scriptLines += "Set-Location '$wd'"
  $scriptLines += "$ErrorActionPreference = 'Continue'"
  if ($EnvVars) {
    foreach ($k in $EnvVars.Keys) {
      $v = $EnvVars[$k]
      # Set process-scoped environment variable dynamically
      $scriptLines += "[System.Environment]::SetEnvironmentVariable('$k', '$v', 'Process')"
    }
  }
  $scriptLines += '$cmd = @'''
  $scriptLines += $CommandLine
  $scriptLines += "'@"
  $pipe = "& cmd.exe /c `$cmd 2>&1 | Tee-Object -FilePath '$log1' -Append"
  if ($log2) { $pipe += " | Tee-Object -FilePath '$log2' -Append" }
  $scriptLines += $pipe

  Set-Content -Path $tmpScript -Value ($scriptLines -join [Environment]::NewLine) -Encoding UTF8

  $psArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File', $tmpScript)
  $proc = Start-Process -FilePath (Get-Command powershell.exe).Source -ArgumentList $psArgs -WorkingDirectory $wd -WindowStyle Hidden -PassThru
  Write-Info "Launched $Name (PID: $($proc.Id))"
  return $proc
}

# ---------------------- MAIN FLOW ----------------------

Write-Info "Preparing to start application services..."
Write-Info "Repository root: $ScriptDir"
Write-Info "Logs directory: $LogsDir"

# COMMON SERVICE PORTS (free them first)
$portsToFree = @(5000, 3000, 5173, 5432, 6379)
if (-not $NoKill) {
  Write-Info "Stopping any processes on ports: $($portsToFree -join ', ')"
  Stop-ProcessesOnPorts -Ports $portsToFree
} else {
  Write-Info "Skipping port cleanup due to -NoKill flag"
}

# Detect package manager and construct dev command
$pm = Detect-PackageManager
$devCmd = Build-DevCommand -PackageManager $pm
Write-Info "Detected package manager: $pm"

# Database: try to start local PostgreSQL service if installed
$dbLog = Join-Path $LogsDir 'db.log'
"$(Get-Date -Format o) - DB startup initiated" | Out-File -FilePath $dbLog -Encoding utf8 -Append

try {
  $pgServices = @(Get-Service | Where-Object { $_.Name -match 'postgres|postgresql' -or $_.DisplayName -match 'PostgreSQL' })
  if ($pgServices.Count -gt 0) {
    foreach ($svc in $pgServices) {
      if ($svc.Status -ne 'Running') {
        Write-Info "Starting database service: $($svc.Name)"
        "$(Get-Date -Format o) - Starting service $($svc.Name)" | Out-File -FilePath $dbLog -Encoding utf8 -Append
        Start-Service -Name $svc.Name -ErrorAction SilentlyContinue
      }
    }
    "$(Get-Date -Format o) - PostgreSQL services verified/started" | Out-File -FilePath $dbLog -Encoding utf8 -Append
  } else {
    Write-Info "No local PostgreSQL Windows services found. Ensure your DB is running (localhost:5432)."
    "$(Get-Date -Format o) - No PostgreSQL service found; external DB expected on localhost:5432" | Out-File -FilePath $dbLog -Encoding utf8 -Append
  }
} catch {
  Write-Info "Database service check failed: $($_.Exception.Message)"
  "$(Get-Date -Format o) - DB service check failed: $($_.Exception.Message)" | Out-File -FilePath $dbLog -Encoding utf8 -Append
}

# Start application server (serves frontend + API on port 5000)
$backendLog = Join-Path $LogsDir 'backend.log'
$frontendLog = Join-Path $LogsDir 'frontend.log'
"$(Get-Date -Format o) - Backend log initialized" | Out-File -FilePath $backendLog -Encoding utf8 -Append
"$(Get-Date -Format o) - Frontend log initialized" | Out-File -FilePath $frontendLog -Encoding utf8 -Append

$envVars = @{ NODE_ENV = 'development'; PORT = '5000' }
$serverProc = Start-LoggedProcess -Name 'server' -CommandLine $devCmd -LogPathPrimary $backendLog -LogPathSecondary $frontendLog -WorkingDirectory $ScriptDir -EnvVars $envVars

# OPTIONAL: Start additional services here if the repository adds them later
# Example placeholder for Redis (if installed as Windows Service)
try {
  $redisSvc = Get-Service -Name 'redis*' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($redisSvc -and $redisSvc.Status -ne 'Running') {
    Write-Info "Starting Redis service: $($redisSvc.Name)"
    Start-Service -Name $redisSvc.Name -ErrorAction SilentlyContinue
  }
} catch {}

Write-Info "All startup commands issued. Services will continue running in background."
Write-Info "- App server (frontend + backend): http://localhost:5000"
Write-Info "- Requested backend port 3000 is not used by this repository; API is served on 5000."
Write-Info "Logs: $backendLog, $frontendLog, $dbLog"

# Keep script alive briefly to surface any immediate startup errors to the console, then exit
Start-Sleep -Seconds 2


