# Fix npm and node in PATH permanently for current user

$nodeDir = "C:\Program Files\nodejs"
$npmAppData = "$env:APPDATA\npm"

# 1. Update User PATH in Windows Registry
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
if (-not $currentPath) { $currentPath = "" }

$list = $currentPath -split ';' | Where-Object { $_ -ne '' -and $_ -ne $null }

if ($list -notcontains $nodeDir) {
    $list += $nodeDir
}
if ($list -notcontains $npmAppData) {
    $list += $npmAppData
}

$newPath = $list -join ';'
[System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::User)

# 2. Set Execution Policy so npm.ps1 can run without restrictions
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

Write-Host "Node.js and npm have been permanently added to the Windows User PATH."
Write-Host "PowerShell script ExecutionPolicy has been set to RemoteSigned."
