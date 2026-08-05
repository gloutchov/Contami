import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const landingRoot = path.join(root, "docs");
const assetsRoot = path.join(landingRoot, "assets");
const html = await readFile(path.join(landingRoot, "index.html"), "utf8");
const script = await readFile(path.join(landingRoot, "app.js"), "utf8");
const styles = await readFile(path.join(landingRoot, "styles.css"), "utf8");

const failures = [];
const fail = (message) => failures.push(message);

for (const required of ["index.html", "styles.css", "app.js", ".nojekyll", "assets/contami-icon.png"]) {
  await access(path.join(landingRoot, required));
}

if (!html.includes("Content-Security-Policy")) fail("Landing page must declare a restrictive CSP");
const applicationScriptTag = '<script defer src="./app.js"></script>';
if (!html.includes(applicationScriptTag)) fail("Landing page must load its local script as a deferred classic script");
if (/<(?:script|style)(?:\s[^>]*)?>\s*(?!<\/)/i.test(html.replace(applicationScriptTag, ""))) {
  fail("Landing page must not contain inline script or style blocks");
}
if (/\sstyle\s*=/i.test(html)) fail("Landing page must not use inline style attributes");
if (html.includes('class="window-bar"')) fail("Landing media must not add platform-specific window chrome");
if (/https?:\/\/(?:fonts\.|cdn\.|unpkg\.|jsdelivr\.)/i.test(`${html}\n${styles}\n${script}`)) {
  fail("Landing page must not depend on remote fonts or CDNs");
}
if (/\.gif\b/i.test(`${html}\n${styles}\n${script}`)) fail("Published landing code must use optimized video rather than GIF sources");
if (/(?:src|poster|href)=["']\/(?!\/)/i.test(html)) fail("Project Pages assets and links must not use root-absolute paths");

const normalizedScript = script.replace(/\r\n?/g, "\n");
const translationSource = normalizedScript.match(/const translations = (\{[\s\S]*?\n\});\n\nconst LANGUAGE_STORAGE_KEY/);
if (!translationSource) {
  fail("Unable to parse landing translations");
} else {
  const translations = vm.runInNewContext(`(${translationSource[1]})`);
  const flatten = (value, prefix = "") => Object.entries(value).flatMap(([key, entry]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "object" && entry !== null ? flatten(entry, next) : [next];
  }).sort();
  const englishKeys = flatten(translations.en);
  const italianKeys = flatten(translations.it);
  if (JSON.stringify(englishKeys) !== JSON.stringify(italianKeys)) fail("Italian and English translation keys must match exactly");

  const usedKeys = [...html.matchAll(/data-i18n(?:-aria|-alt)?=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const key of new Set(usedKeys)) {
    if (!englishKeys.includes(key)) fail(`Missing translation key used by HTML: ${key}`);
  }
}

const literalAssetReferences = [...html.matchAll(/(?:src|poster|content)=["']\.\/assets\/([^"']+)["']/g)].map((match) => match[1]);
for (const asset of new Set(literalAssetReferences)) {
  try {
    await access(path.join(assetsRoot, asset));
  } catch {
    fail(`Missing referenced landing asset: ${asset}`);
  }
}

const mediaKeys = ["panoramica", "transazioni", "immobili", "automobili", "investimenti", "pensioneintegrativa", "ricorrenze", "spesecondivise", "impostazioni"];
for (const key of mediaKeys) {
  for (const file of [`${key}.mp4`, `${key}_english.mp4`, `${key}_whi.png`, `${key}_blk.png`, `${key}_whi_english.png`, `${key}_blk_english.png`]) {
    try {
      await access(path.join(assetsRoot, file));
    } catch {
      fail(`Missing localized media variant: ${file}`);
    }
  }
}

for (const entry of await readdir(assetsRoot, { withFileTypes: true })) {
  if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".mp4") continue;
  const metadata = await stat(path.join(assetsRoot, entry.name));
  if (metadata.size > 5 * 1024 * 1024) fail(`Optimized video exceeds 5 MiB: ${entry.name}`);
}

for (const selector of ["prefers-color-scheme: dark", "prefers-reduced-motion: reduce", "max-width: 760px", ":focus-visible"]) {
  if (!styles.includes(selector)) fail(`Landing CSS is missing required responsive/accessibility rule: ${selector}`);
}
if (!styles.includes(".reveal-ready .reveal")) fail("Landing content must remain visible when JavaScript is unavailable");
if (!styles.includes("--app-content-ratio: 1280 / 752")) fail("Landing media must crop the captured desktop chrome consistently");
for (const behavior of ["navigator.language", "localStorage", "aria-pressed", "themeQuery.addEventListener"]) {
  if (!script.includes(behavior)) fail(`Landing script is missing required language/theme behavior: ${behavior}`);
}

if (failures.length) throw new Error(`Landing validation failed:\n- ${failures.join("\n- ")}`);
console.log(`Landing validation passed (${mediaKeys.length} bilingual media sets).`);
