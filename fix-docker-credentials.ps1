# Fix Docker Credentials and Create Working Container
Write-Host "🔧 Fixing Docker Credentials..." -ForegroundColor Cyan

# Create Docker config to bypass credential helper
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

Write-Host "✅ Docker credentials configured" -ForegroundColor Green

# Now try to build the image
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

& $dockerPath build -t creator-ai-local .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
    Write-Host "🚀 You can now run: docker run -p 5000:5000 creator-ai-local" -ForegroundColor White
} else {
    Write-Host "❌ Docker build failed. Using local development instead." -ForegroundColor Red
}