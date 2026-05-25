param(
  [Parameter(Mandatory = $true)]
  [string]$ImagePath,

  [int]$Port = 9444,

  [string]$HostName = "127.0.0.1",

  [string]$OutCss = ""
)

$ErrorActionPreference = "Stop"

$pluginRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$templatePath = Join-Path $pluginRoot "templates\wallpaper.css"
$injectorPath = Join-Path $pluginRoot "scripts\inject-css.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 22+ is required. Install Node.js and retry."
}

if (-not (Test-Path -LiteralPath $ImagePath)) {
  throw "Image not found: $ImagePath"
}

try {
  Invoke-RestMethod -Uri "http://${HostName}:$Port/json/list" -TimeoutSec 3 | Out-Null
} catch {
  throw "Codex CDP is not reachable at http://${HostName}:$Port. Run scripts\\start-codex-debug.ps1 first, or start Codex with --remote-debugging-port=$Port."
}

if (-not $OutCss) {
  $generatedDir = Join-Path $pluginRoot ".generated"
  New-Item -ItemType Directory -Path $generatedDir -Force | Out-Null
  $OutCss = Join-Path $generatedDir "codex-wallpaper.generated.css"
}

$extension = [System.IO.Path]::GetExtension($ImagePath).ToLowerInvariant()
$mime = switch ($extension) {
  ".jpg" { "image/jpeg" }
  ".jpeg" { "image/jpeg" }
  ".png" { "image/png" }
  ".webp" { "image/webp" }
  default { throw "Unsupported image type: $extension. Use jpg, jpeg, png, or webp." }
}

$resolvedImagePath = (Resolve-Path -LiteralPath $ImagePath).Path
$bytes = [System.IO.File]::ReadAllBytes($resolvedImagePath)
$dataUrl = "data:$mime;base64," + [Convert]::ToBase64String($bytes)
$template = Get-Content -LiteralPath $templatePath -Raw
$css = $template.Replace("__IMAGE_DATA_URL__", $dataUrl)
Set-Content -LiteralPath $OutCss -Value $css -Encoding UTF8

node $injectorPath --host $HostName --port $Port --css $OutCss
Write-Host "Generated CSS: $OutCss"
Write-Host "Wallpaper source: $resolvedImagePath"
