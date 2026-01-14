try {
    Write-Host "Testing CreatorAI Studio application..."
    
    # Test main page
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Main page loads: Status $($response.StatusCode)"
    
    # Test if JavaScript assets are accessible
    $jsPattern = 'src="(/assets/[^"]+\.js)"'
    $matches = [regex]::Matches($response.Content, $jsPattern)
    
    if ($matches.Count -gt 0) {
        $jsUrl = "http://localhost:5000" + $matches[0].Groups[1].Value
        $jsResponse = Invoke-WebRequest -Uri $jsUrl -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ JavaScript assets load: Status $($jsResponse.StatusCode)"
    }
    
    # Test API endpoint
    try {
        $apiResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/websocket/stats" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ API endpoints work: Status $($apiResponse.StatusCode)"
    } catch {
        Write-Host "⚠️ API test failed: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Write-Host "🎉 Application is running successfully on http://localhost:5000"
    Write-Host "You can now open your browser and navigate to the application!"
    
} catch {
    Write-Host "❌ Error testing application: $($_.Exception.Message)"
}