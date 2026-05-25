import fs from 'node:fs';

const cssPath = new URL('../templates/wallpaper.css', import.meta.url);
const css = fs.readFileSync(cssPath, 'utf8');

const failures = [];

function assertIncludes(needle, message) {
  if (!css.includes(needle)) failures.push(message);
}

function assertNotIncludes(needle, message) {
  if (css.includes(needle)) failures.push(message);
}

assertNotIncludes('rgba(255, 254, 249, 0.30)', 'main content overlay is still too white');
assertNotIncludes('rgba(255, 254, 249, 0.28)', 'thread overlay is still too white');
assertNotIncludes('rgba(255, 254, 250, 0.78)', 'top header overlay is still too opaque');
assertIncludes('--codex-wallpaper-panel', 'shared panel token is missing');
assertIncludes('--codex-wallpaper-readable', 'readable content panel token is missing');
assertIncludes('background: transparent !important;', 'main content should allow wallpaper to show through');
assertIncludes('[class*="min-h-full"][class*="justify-start"]', 'thread top washout gradient needs an explicit override');
assertIncludes('[class*="max-w-(--thread-content-max-width)"][class*="px-toolbar"]', 'thread content needs a readable glass panel');
assertIncludes('[class*="bg-token-main-surface-secondary"]', 'onboarding cards need explicit contrast styling');
assertIncludes('color: #f7f4e8 !important;', 'dark cards need light readable text');

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}
