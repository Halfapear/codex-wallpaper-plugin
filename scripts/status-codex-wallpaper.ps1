param(
  [int]$Port = 9444,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 22+ is required. Install Node.js and retry."
}

$pluginRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$injectorPath = Join-Path $pluginRoot "scripts\inject-css.mjs"

node $injectorPath --host $HostName --port $Port --status
