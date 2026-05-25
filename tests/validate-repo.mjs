import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readText = (path) => readFileSync(path, 'utf8');

const readme = readText('README.md');
const skill = readText('skills/codex-wallpaper/SKILL.md');
const startScript = readText('scripts/start-codex-debug.ps1');
const injector = readText('scripts/inject-css.mjs');

assert.match(
  readme,
  /DexThemes is a Codex theme gallery and builder/i,
  'README should introduce DexThemes as a theme gallery and builder.',
);

assert.match(
  readme,
  /awesome-codex-plugins is a community list/i,
  'README should introduce awesome-codex-plugins as a community list.',
);

const machineSpecificPathPattern = new RegExp(
  String.raw`[A-Z]:\\(?:Pictures|Users|One` + String.raw`Drive)\\`,
);

for (const [name, text] of [
  ['README.md', readme],
  ['skills/codex-wallpaper/SKILL.md', skill],
]) {
  assert.doesNotMatch(
    text,
    machineSpecificPathPattern,
    `${name} should avoid machine-specific example paths.`,
  );
}

assert.match(
  startScript,
  /Codex is already running without CDP\. Quit Codex, then rerun this script\. This script will not kill your app\./,
  'start-codex-debug.ps1 should fail clearly instead of starting another instance when Codex is already running without CDP.',
);

assert.match(
  injector,
  /function selectPageTargets/,
  'inject-css.mjs should select all matching app page targets.',
);

assert.match(
  injector,
  /for \(const target of pageTargets\)/,
  'inject-css.mjs should apply actions to every selected page target.',
);
