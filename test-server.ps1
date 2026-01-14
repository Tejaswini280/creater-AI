try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 10
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Content Length: $($response.Content.Length)"
    Write-Host "First 200 characters:"
    Write-Host $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Error Type: $($_.Exception.GetType().Name)"
}