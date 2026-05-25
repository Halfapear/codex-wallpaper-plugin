param(
  [int]$Port = 9444,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

$pluginRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$restoreCss = Join-Path $pluginRoot "templates\restore.css"
$injectorPath = Join-Path $pluginRoot "scripts\inject-css.mjs"

node $injectorPath --host $HostName --port $Port --css $restoreCss
