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

if (-not (Test-Path -LiteralPath $ImagePath)) {
  throw "Image not found: $ImagePath"
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

$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $ImagePath))
$dataUrl = "data:$mime;base64," + [Convert]::ToBase64String($bytes)
$template = Get-Content -LiteralPath $templatePath -Raw
$css = $template.Replace("__IMAGE_DATA_URL__", $dataUrl)
Set-Content -LiteralPath $OutCss -Value $css -Encoding UTF8

node $injectorPath --host $HostName --port $Port --css $OutCss
Write-Host "Generated CSS: $OutCss"
