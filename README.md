# Codex Wallpaper Plugin

Use a local JPG, PNG, or WebP image as the background wallpaper for Codex Desktop on Windows.

This is a first public version of a small Codex plugin plus helper scripts. It uses Chrome DevTools Protocol (CDP) to inject CSS into a running Codex Desktop window. It does not patch `app.asar`, does not modify the installed app package, and does not upload your image anywhere.

## Features

- Applies a local image as the Codex Desktop background.
- Adds blurred glass layers so chat text stays readable.
- Keeps the bottom composer visible without a full-width white tray.
- Styles the sidebar, top bar, right output cards, and main chat surface as one coherent wallpaper theme.
- Includes a Codex plugin manifest and skill instructions.
- Includes a restore script for removing the injected wallpaper layer.

## Requirements

- Windows.
- Codex Desktop.
- Node.js 18 or newer.
- PowerShell.
- Codex Desktop must be running with a local CDP port, for example `9444`.

## Quick Start

Start Codex Desktop with remote debugging enabled. The exact path can vary by installation, but the launch arguments should look like this:

```powershell
Codex.exe --remote-debugging-address=127.0.0.1 --remote-debugging-port=9444
```

Then apply a wallpaper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\apply-codex-wallpaper.ps1 -ImagePath "D:\Pictures\wallpaper.jpg" -Port 9444
```

Restore the default injected style:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-codex-wallpaper.ps1 -Port 9444
```

## Codex Plugin

The plugin manifest is in `.codex-plugin/plugin.json`, and the skill is in `skills/codex-wallpaper/SKILL.md`.

The skill tells Codex how to:

- Ask for a local image path.
- Apply the wallpaper through `scripts/apply-codex-wallpaper.ps1`.
- Inspect and tune readability.
- Restore the neutral style.

## How It Works

1. `apply-codex-wallpaper.ps1` reads your local image.
2. It converts the image to a local CSS data URL.
3. It writes `.generated/codex-wallpaper.generated.css`.
4. `inject-css.mjs` connects to the Codex Desktop CDP endpoint.
5. It injects the generated CSS into the active `app://` page.

The generated CSS is ignored by Git because it contains your private image data.

## Privacy

This plugin does not send your image to any service. The image is read locally and embedded into a generated local CSS file. Do not commit `.generated/` or generated CSS files if they contain private images.

## Known Limits

- This is Windows-first and tested against Codex Desktop with a CDP debug port.
- If Codex Desktop is not launched with remote debugging, the scripts cannot connect.
- Codex Desktop DOM class names may change between app versions. If that happens, the CSS selectors may need an update.
- The restore script only removes this plugin's injected style layer; it does not undo unrelated theme tools.

## Related Work

- [`jstxn/codex-themes`](https://github.com/jstxn/codex-themes) is a broader Codex Desktop theme injection project. This repository focuses specifically on local image wallpaper and readability tuning.

## Version

`0.1.0` is the first public version.

## License

MIT
