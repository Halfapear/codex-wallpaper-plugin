# Codex Wallpaper Plugin

Local image wallpaper for Codex Desktop on Windows.

This plugin applies a JPG, PNG, or WebP image as the Codex Desktop chat background and keeps the interface readable with blurred glass surfaces. It is intentionally small: no npm install, no app bundle patching, no uploaded images.

## Why

DexThemes is a Codex theme gallery and builder for choosing and sharing color themes. awesome-codex-plugins is a community list for discovering Codex extensions and related resources.

This project is narrower: it is a wallpaper plugin for local images. Codex theme controls can change colors, but image backgrounds need extra work because the chat surface, sidebar, top bar, output panel, and composer all need different opacity and blur rules. This plugin packages those rules with scripts that are easy to run and easy to undo.

## What You Get

- Local JPG, PNG, JPEG, and WebP wallpaper support.
- Blurred main chat glass that does not wash the image out.
- Dark readable chat text.
- Sidebar and top bar styling that matches the wallpaper.
- Composer styling without a full-width white tray behind it.
- `status`, `apply`, `restore`, and `start Codex with CDP` scripts.
- A Codex plugin manifest and a `codex-wallpaper` skill.

## Requirements

- Windows.
- Codex Desktop.
- PowerShell.
- Node.js 22 or newer.

## Quick Start

Clone the repo:

```powershell
git clone https://github.com/Halfapear/codex-wallpaper-plugin.git
cd codex-wallpaper-plugin
```

Start Codex Desktop with a local debug port:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-codex-debug.ps1 -Port 9444
```

This script does not close or restart Codex. If Codex is already open without CDP, quit Codex yourself and run the script again.

Apply a wallpaper:

```powershell
$wallpaper = Join-Path $env:USERPROFILE "Pictures\wallpaper.jpg"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\apply-codex-wallpaper.ps1 -ImagePath $wallpaper -Port 9444
```

Check status:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\status-codex-wallpaper.ps1 -Port 9444
```

Remove the injected wallpaper style:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-codex-wallpaper.ps1 -Port 9444
```

## Scripts

| Script | Purpose |
| --- | --- |
| `scripts/start-codex-debug.ps1` | Starts Codex Desktop with `--remote-debugging-port` if Codex is not already running. |
| `scripts/apply-codex-wallpaper.ps1` | Converts a local image to generated CSS and injects it. |
| `scripts/status-codex-wallpaper.ps1` | Reports whether the wallpaper style is currently injected. |
| `scripts/restore-codex-wallpaper.ps1` | Removes this plugin's injected style element. |
| `scripts/inject-css.mjs` | Minimal CDP injector used by the PowerShell scripts. |
| `scripts/check-wallpaper-css.mjs` | Repository check for washed-out wallpaper CSS regressions. |

## Validation

Run the repository checks:

```powershell
node .\tests\validate-repo.mjs
python <path-to-codex>\skills\.system\plugin-creator\scripts\validate_plugin.py .
```

## How It Works

1. `apply-codex-wallpaper.ps1` validates Node.js, the image path, and the Codex CDP port.
2. It reads the local image and embeds it as a CSS data URL.
3. It writes `.generated/codex-wallpaper.generated.css`.
4. `inject-css.mjs` connects to the running Codex Desktop `app://` page.
5. It creates or updates a single style element: `#codex-wallpaper-plugin-style`.
6. `restore-codex-wallpaper.ps1` removes that style element.

The generated CSS is ignored by Git because it contains your private image data.

## Codex Plugin Layout

```text
.codex-plugin/plugin.json
skills/codex-wallpaper/SKILL.md
scripts/
templates/wallpaper.css
```

The skill teaches Codex how to apply, tune, inspect, and restore the wallpaper.

## Privacy

Images stay local. The script reads your image and writes a generated CSS file under `.generated/`. Nothing is uploaded by this plugin.

Do not commit `.generated/` or generated CSS files if they contain private images.

## Troubleshooting

`Codex CDP is not reachable`

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-codex-debug.ps1 -Port 9444
```

If Codex was already open before running the script, quit Codex yourself and run the script again. The script will not kill your running app.

`WebSocket is not defined`

Install Node.js 22 or newer. The injector uses the built-in WebSocket client.

`Unsupported image type`

Use `.jpg`, `.jpeg`, `.png`, or `.webp`.

`No CDP page target found`

Codex is exposing a debug port, but no `app://` page was found. Open a Codex window and retry.

## Known Limits

- Windows-first.
- Requires Codex Desktop to expose a local CDP port.
- Codex Desktop DOM class names can change between releases.
- This removes only its own injected style layer; it does not undo unrelated theme tools.

## Related Work

- [DexThemes](https://www.dexthemes.com/) is a Codex theme gallery and builder for color themes.
- [`jstxn/codex-themes`](https://github.com/jstxn/codex-themes) is a broader Codex Desktop theme injection project.
- [`awesome-codex-plugins`](https://github.com/hashgraph-online/awesome-codex-plugins) is a community list for Codex plugins and resources.

## Version

Current version: `0.2.3`.

## License

MIT
