$ErrorActionPreference = 'Stop'

$localApp = [Environment]::GetFolderPath('LocalApplicationData')
$targetDir = Join-Path $localApp 'Programs\Git'
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$zipPath = Join-Path $env:TEMP 'MinGit.zip'
$url = 'https://github.com/git-for-windows/git/releases/download/v2.48.1.windows.1/MinGit-2.48.1-64-bit.zip'

Write-Host "Downloading Portable Git from: $url"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

Write-Host "Extracting to: $targetDir"
Expand-Archive -Path $zipPath -DestinationPath $targetDir -Force
Remove-Item $zipPath -Force

$gitCmdDir = Join-Path $targetDir 'cmd'
if (-not (Test-Path $gitCmdDir)) {
    $gitCmdDir = $targetDir
}

# 1. Update Current Session PATH
$env:PATH = "$gitCmdDir;" + $env:PATH

# 2. Update Persistent Windows User PATH in Registry
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$gitCmdDir*") {
    [Environment]::SetEnvironmentVariable('Path', "$gitCmdDir;$userPath", 'User')
    Write-Host "Added to Windows User Environment PATH: $gitCmdDir"
}

# 3. Update PowerShell Profile
$profilePath = $PROFILE
$profileDir = [System.IO.Path]::GetDirectoryName($profilePath)
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$profileContent = @"
# Ensure Node.js, npm, and Git are always available across all PowerShell sessions
`$pathsToAdd = @(
    'C:\Program Files\nodejs',
    "`$env:APPDATA\npm",
    '$gitCmdDir'
)
foreach (`$p in `$pathsToAdd) {
    if (`$env:PATH -notlike "*`$p*") {
        `$env:PATH = "`$p;`$env:PATH"
    }
}
"@

Set-Content -Path $profilePath -Value $profileContent -Force
Write-Host "Configured PowerShell Profile at: $profilePath"

# 4. Test Git execution
Write-Host "Testing Git version:"
& (Join-Path $gitCmdDir 'git.exe') --version
Write-Host "Git setup successfully completed!"
