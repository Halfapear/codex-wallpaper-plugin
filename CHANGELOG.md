# Changelog

## 0.2.3

- Apply, remove, and report status across every matching Codex CDP page target instead of only the first one.
- Add a readable glass layer behind the thread content so text does not sit directly on busy wallpaper art.
- Extend repository checks for multi-target injection and readable content panels.

## 0.2.2

- Make the wallpaper image apply directly to the main surface instead of relying on a large CSS custom property.
- Remove Codex's thread washout gradient so image backgrounds remain visible.
- Tune the default overlay, sidebar, top bar, composer, and dark card contrast.
- Add `check-wallpaper-css.mjs` to catch washed-out wallpaper regressions.

## 0.2.1

- Explain how this wallpaper plugin relates to DexThemes and community plugin lists.
- Replace machine-specific example wallpaper paths with `$env:USERPROFILE` examples.
- Make `start-codex-debug.ps1` stop early with a clear message when Codex is already running without CDP.
- Add a lightweight repository validation script for docs and startup behavior.

## 0.2.0

- Add `start-codex-debug.ps1` for easier setup.
- Add `status-codex-wallpaper.ps1` for verification.
- Make restore remove the injected style element instead of injecting fallback CSS.
- Improve CDP timeout and error messages.
- Document Node.js 22+ requirement for the built-in WebSocket injector.
- Add `.gitattributes` for stable cross-platform line endings.
- Rewrite README with clearer onboarding, script table, troubleshooting, and related work.

## 0.1.0

- Initial public version.
- Add Codex plugin manifest.
- Add `codex-wallpaper` skill.
- Add Windows apply and restore scripts.
- Add CDP CSS injector with no npm dependencies.
- Add wallpaper CSS template with blurred glass chat surfaces.
- Add privacy-safe generated CSS workflow.
