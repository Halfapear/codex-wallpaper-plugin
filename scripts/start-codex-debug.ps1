param(
  [int]$Port = 9444,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

function Test-CdpReady {
  param([string]$HostName, [int]$Port)
  try {
    Invoke-RestMethod -Uri "http://${HostName}:$Port/json/list" -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

if (Test-CdpReady -HostName $HostName -Port $Port) {
  Write-Host "Codex CDP is already reachable at http://${HostName}:$Port"
  exit 0
}

$codexExe = $null

$runningMain = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object {
    $_.Name -eq "Codex.exe" -and
    $_.ExecutablePath -and
    $_.CommandLine -notmatch "--type="
  } |
  Select-Object -First 1

if ($runningMain -and (Test-Path -LiteralPath $runningMain.ExecutablePath)) {
  $codexExe = $runningMain.ExecutablePath
}

if (-not $codexExe) {
  $packageRoot = "C:\Program Files\WindowsApps"
  $candidate = Get-ChildItem -LiteralPath $packageRoot -Directory -Filter "OpenAI.Codex_*" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName "app\Codex.exe" } |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1
  if ($candidate) {
    $codexExe = $candidate
  }
}

if (-not $codexExe) {
  $command = Get-Command Codex.exe -ErrorAction SilentlyContinue
  if ($command) {
    $codexExe = $command.Source
  }
}

if (-not $codexExe) {
  throw "Could not find Codex.exe. Start Codex once, then retry this script."
}

$args = "--remote-debugging-address=$HostName --remote-debugging-port=$Port --no-first-run --no-default-browser-check"
Write-Host "Starting Codex with CDP on http://${HostName}:$Port"
Start-Process -FilePath $codexExe -ArgumentList $args

for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 500
  if (Test-CdpReady -HostName $HostName -Port $Port) {
    Write-Host "Codex CDP is ready at http://${HostName}:$Port"
    exit 0
  }
}

throw "Codex started, but CDP did not become reachable. If Codex was already running, close it and run this script again."
