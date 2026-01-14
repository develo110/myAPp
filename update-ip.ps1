# PowerShell script to update the mobile app's API URL with current IP address

# Get the current IP address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" | Where-Object {$_.IPAddress -like "10.*" -or $_.IPAddress -like "192.168.*"}).IPAddress

if ($ipAddress) {
    Write-Host "Current IP Address: $ipAddress"
    
    # Update the .env file
    $envPath = "mobile\.env"
    $content = Get-Content $envPath
    $newContent = $content -replace "EXPO_PUBLIC_API_URL=http://.*:5004", "EXPO_PUBLIC_API_URL=http://${ipAddress}:5004"
    
    Set-Content -Path $envPath -Value $newContent
    
    Write-Host "Updated mobile/.env with new IP address: $ipAddress"
    Write-Host "Please restart your Expo development server for changes to take effect."
} else {
    Write-Host "Could not detect IP address. Please update manually."
}

# Test connectivity
Write-Host "Testing server connectivity..."
try {
    $response = Invoke-WebRequest -Uri "http://${ipAddress}:5004" -TimeoutSec 5
    Write-Host "✅ Server is accessible at http://${ipAddress}:5004"
} catch {
    Write-Host "❌ Server is not accessible. Make sure the backend is running."
}