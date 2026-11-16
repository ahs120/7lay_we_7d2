#!/usr/bin/env node
// scripts/audit-renderer.mjs
// Static analysis linter enforcing UI Contract rules across src/renderer/.
// Exits with code 1 if any ERROR rule fails.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const RENDERER = join(ROOT, 'src', 'renderer');

const errors = [];
const warnings = [];

function addError(file, line, rule, message) {
  errors.push({ file: relative(ROOT, file), line, rule, message });
}

function addWarn(file, line, rule, message) {
  warnings.push({ file: relative(ROOT, file), line, rule, message });
}

function walk(dir) {
  const files = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    const st = statSync(full);
    if (st.isDirectory()) {
      // Skip vendor assets
      if (item === 'vendor' || item === 'fonts') continue;
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk(RENDERER);

// ── Arabic regex ──────────────────────────────────────────────────────────────
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

// ── Forbidden Node built-ins ──────────────────────────────────────────────────
const NODE_BUILTINS = new Set([
  'fs', 'fs/promises', 'path', 'crypto', 'os', 'child_process', 'url',
  'http', 'https', 'stream', 'util', 'events', 'electron'
]);

for (const file of allFiles) {
  const rel = relative(RENDERER, file).replace(/\\/g, '/');
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  const isHtml = file.endsWith('.html');
  const isCss = file.endsWith('.css');
  const isJs = file.endsWith('.js');
  const isSvg = file.endsWith('.svg');

  // Allow Arabic in i18n/ar.js and styleguide/sample-data.js
  const allowArabic = rel.includes('i18n/ar.js') || rel.includes('sample-data.js');
  // Allow hex colors in tokens.css and patterns
  const allowColors = rel.includes('tokens.css') || rel.includes('patterns/') || rel.includes('sample-data.js');
  // Router DOMParser exception
  const isRouter = rel === 'router.js';

  let inBlockComment = false;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    let trimmed = lineText.trim();

    // Multiline comment tracking
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
        trimmed = trimmed.slice(trimmed.indexOf('*/') + 2).trim();
      } else {
        return;
      }
    }

    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
        return;
      } else {
        trimmed = trimmed.replace(/\/\*.*?\*\//g, '').trim();
      }
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    // Rule 1: No innerHTML
    if (/\.innerHTML\b/.test(lineText) && !isRouter) {
      addError(file, lineNum, 'NO_INNER_HTML', 'innerHTML is forbidden in renderer');
    }

    // Rule 2: No outerHTML
    if (/\.outerHTML\b/.test(lineText)) {
      addError(file, lineNum, 'NO_OUTER_HTML', 'outerHTML is forbidden in renderer');
    }

    // Rule 3: No insertAdjacentHTML
    if (/\.insertAdjacentHTML\b/.test(lineText)) {
      addError(file, lineNum, 'NO_ADJACENT_HTML', 'insertAdjacentHTML is forbidden in renderer');
    }

    // Rule 4: No inline style attributes in HTML
    if (isHtml && /\bstyle\s*=\s*["']/.test(lineText)) {
      addError(file, lineNum, 'NO_INLINE_STYLE_ATTR', 'inline style="" attribute forbidden in HTML');
    }

    // Rule 5: No inline onclick/on* attributes in HTML
    if (isHtml && /\bon[a-z]+\s*=\s*["']/.test(lineText)) {
      addError(file, lineNum, 'NO_INLINE_EVENT_ATTR', 'inline event handlers (onclick, etc.) forbidden in HTML');
    }

    // Rule 6: No hardcoded hex/rgb outside tokens.css
    if (isCss && !allowColors) {
      if (/#([0-9a-fA-F]{3,8})\b/.test(lineText) && !lineText.includes('/* allow-color */')) {
        addError(file, lineNum, 'NO_RAW_COLORS_IN_CSS', 'hardcoded color found in CSS — use tokens.css variables');
      }
      if (/\brgba?\s*\(/.test(lineText) && !lineText.includes('/* allow-color */')) {
        addError(file, lineNum, 'NO_RAW_COLORS_IN_CSS', 'rgba() found in CSS — use tokens.css variables');
      }
    }

    // Rule 7: Physical properties without /* allow-physical */ comment
    if (isCss) {
      const physicalMatch = /\b(margin|padding)-(left|right)\s*:|\b(left|right)\s*:\s*[0-9]/.test(lineText);
      if (physicalMatch && !lineText.includes('/* allow-physical') && !lineText.includes('scaleX(-1)')) {
        addError(file, lineNum, 'LOGICAL_PROPERTIES_ONLY', 'Physical property (left/right) used without /* allow-physical */ comment');
      }
    }

    // Rule 8: No Arabic literals outside ar.js & sample-data.js
    if (isJs && !allowArabic) {
      // Strip line comments
      const clean = trimmed.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
      if (ARABIC_REGEX.test(clean)) {
        addError(file, lineNum, 'NO_ARABIC_IN_CODE', 'Arabic text literal found in JS outside ar.js / sample-data.js');
      }
    }

    // Rule 9: No external URLs
    if (/https?:\/\//.test(lineText)) {
      if (!lineText.includes('http://www.w3.org/2000/svg')) {
        addError(file, lineNum, 'NO_EXTERNAL_URLS', 'External HTTP/HTTPS URL found in renderer');
      }
    }

    // Rule 10: ESM imports must end with .js
    if (isJs && /^import\s+.*from\s+['"]([^'"]+)['"]/.test(trimmed)) {
      const match = trimmed.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
      const spec = match?.[1];
      if (spec && (spec.startsWith('.') || spec.startsWith('/'))) {
        if (!spec.endsWith('.js') && !spec.endsWith('.json')) {
          addError(file, lineNum, 'IMPORT_EXTENSION_REQUIRED', `Import "${spec}" missing .js extension`);
        }
      }
    }

    // Rule 11: No Node built-ins in renderer
    if (isJs && /^import\s+.*from\s+['"]([^'"]+)['"]/.test(trimmed)) {
      const match = trimmed.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
      const spec = match?.[1];
      if (NODE_BUILTINS.has(spec) || spec?.startsWith('node:')) {
        addError(file, lineNum, 'NO_NODE_BUILTINS', `Node.js built-in module "${spec}" imported in renderer`);
      }
    }

    // Rule 14: No eval, new Function
    if (isJs && (/\beval\s*\(/.test(lineText) || /\bnew\s+Function\s*\(/.test(lineText))) {
      addError(file, lineNum, 'NO_EVAL', 'eval() or new Function() is forbidden');
    }
  });
}

// ── Summary Output ────────────────────────────────────────────────────────────
console.log('── Audit Renderer Report ───────────────────────────────────');
console.log(`Scanned ${allFiles.length} files in src/renderer/`);

if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`  [WARN] ${w.file}:${w.line} [${w.rule}] ${w.message}`));
}

if (errors.length > 0) {
  console.error(`\nErrors (${errors.length}):`);
  errors.forEach(e => console.error(`  [ERROR] ${e.file}:${e.line} [${e.rule}] ${e.message}`));
  console.error('\nAudit FAILED ❌');
  process.exit(1);
} else {
  console.log('\nAudit PASSED ✅ (0 errors)');
  process.exit(0);
}
