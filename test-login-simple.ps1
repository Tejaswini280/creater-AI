try {
    Write-Host "Testing login with simple request..."
    
    $uri = "http://localhost:5000/api/auth/login"
    $body = '{"email":"admin@example.com","password":"password123"}'
    
    $response = Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}