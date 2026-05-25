---
name: codex-wallpaper
description: Apply, tune, inspect, or restore a local JPG/PNG wallpaper for the Windows Codex Desktop app using non-destructive CSS injection.
---

# Codex Wallpaper

Use this skill when the user wants a local image as the Codex Desktop background, wants the wallpaper made more readable, or wants the injected wallpaper restored.

## Workflow

1. Confirm the target is Codex Desktop on Windows.
2. Ask for an absolute image path if the user has not provided one.
3. Ensure Codex Desktop exposes a CDP port. If not, run `scripts/start-codex-debug.ps1`.
4. Run `scripts/apply-codex-wallpaper.ps1` from the plugin root.
5. Run `scripts/status-codex-wallpaper.ps1` or verify with a screenshot before claiming success.

## Commands

Apply a wallpaper to an already running Codex Desktop instance that exposes CDP:

```powershell
$wallpaper = Join-Path $env:USERPROFILE "Pictures\wallpaper.jpg"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\apply-codex-wallpaper.ps1 -ImagePath $wallpaper
```

Start Codex with CDP:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-codex-debug.ps1 -Port 9444
```

Use a custom debug port:

```powershell
$wallpaper = Join-Path $env:USERPROFILE "Pictures\wallpaper.jpg"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\apply-codex-wallpaper.ps1 -ImagePath $wallpaper -Port 9444
```

Check status:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\status-codex-wallpaper.ps1 -Port 9444
```

Restore by removing the injected style element:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-codex-wallpaper.ps1 -Port 9444
```

## Safety Notes

- This plugin does not patch `app.asar`.
- It injects one style element into a running Codex Desktop page through Chrome DevTools Protocol.
- It embeds the selected image into a generated local CSS file as a data URL.
- Do not publish generated CSS files if they contain a private image.
- If Codex is already running without remote debugging, ask the user to quit Codex before running `scripts/start-codex-debug.ps1`; the script will not kill the app.
