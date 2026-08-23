$targetFile = $PROFILE
$dir = [System.IO.Path]::GetDirectoryName($targetFile)

if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$script = @'
# Ensure Node.js and npm are available
if ($env:PATH -notlike "*C:\Program Files\nodejs*") {
    $env:PATH = "C:\Program Files\nodejs;$env:APPDATA\npm;$env:PATH"
}
'@

Set-Content -Path $targetFile -Value $script -Force
Write-Host "Profile written to: $targetFile"
