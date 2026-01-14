# Verify Migration Numbers - No Duplicates
# This script checks for duplicate migration numbers

Write-Host "Checking for duplicate migration numbers..." -ForegroundColor Cyan
Write-Host ""

# Get all active migration files
$migrations = Get-ChildItem migrations -Filter "*.sql" | 
    Where-Object { 
        $_.Name -notlike "*.retired*" -and 
        $_.Name -notlike "*.disabled*" -and 
        $_.Name -notlike "*.skip*" -and 
        $_.Name -notlike "*.backup*" 
    }

Write-Host "Found $($migrations.Count) active migration files" -ForegroundColor Green
Write-Host ""

# Extract migration numbers (first 4 characters)
$migrationNumbers = $migrations | ForEach-Object { 
    [PSCustomObject]@{
        Number = $_.Name.Substring(0, 4)
        FileName = $_.Name
    }
}

# Group by number to find duplicates
$duplicates = $migrationNumbers | Group-Object Number | Where-Object { $_.Count -gt 1 }

if ($duplicates.Count -eq 0) {
    Write-Host "SUCCESS: No duplicate migration numbers found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Migration sequence:" -ForegroundColor Cyan
    $migrations | Sort-Object Name | ForEach-Object {
        Write-Host "   $($_.Name)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "All migrations have unique numbers" -ForegroundColor Green
    Write-Host "Ready for deployment" -ForegroundColor Green
    exit 0
} else {
    Write-Host "ERROR: Found duplicate migration numbers!" -ForegroundColor Red
    Write-Host ""
    
    foreach ($duplicate in $duplicates) {
        Write-Host "Migration number $($duplicate.Name) appears $($duplicate.Count) times:" -ForegroundColor Yellow
        $duplicate.Group | ForEach-Object {
            Write-Host "   - $($_.FileName)" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    Write-Host "Fix: Rename or retire conflicting migrations" -ForegroundColor Yellow
    Write-Host "Example: Rename-Item migrations/0001_old.sql 0001_old.sql.retired" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
