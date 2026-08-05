import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FORBIDDEN_RENDERER_PATTERNS = [
  ["JSX style attribute", /\bstyle\s*=/],
  ["DOM style mutation", /\.style(?:\.|\[)/],
  ["style setAttribute", /setAttribute\(\s*["']style["']/],
  ["cssText mutation", /\bcssText\b/],
  ["Recharts runtime styling", /from\s+["']recharts["']/],
];

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(fullPath));
    else if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

export function assertStrictProductionCspHtml(html, source = "renderer index") {
  const meta = html.match(/<meta\s+[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i)?.[0];
  if (!meta) throw new Error(`${source}: Content-Security-Policy meta tag is missing`);
  const policy = meta.match(/content="([^"]*)"/i)?.[1] ?? meta.match(/content='([^']*)'/i)?.[1];
  if (!policy) throw new Error(`${source}: Content-Security-Policy content is missing`);
  for (const required of [
    "style-src 'self'",
    "style-src-elem 'self'",
    "style-src-attr 'none'",
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-src 'none'",
  ]) {
    if (!policy.split("; ").includes(required)) throw new Error(`${source}: missing strict directive ${required}`);
  }
  for (const forbidden of ["'unsafe-inline'", "'unsafe-eval'", "http://", "https://", "ws://", "wss://"]) {
    if (policy.includes(forbidden)) throw new Error(`${source}: production policy contains ${forbidden}`);
  }
  if (/\sstyle=["']/i.test(html)) throw new Error(`${source}: inline style attribute found in HTML`);
}

export async function validateRendererSources(rendererRoot = path.resolve("src", "renderer")) {
  const violations = [];
  for (const file of await sourceFiles(rendererRoot)) {
    const source = await readFile(file, "utf8");
    for (const [label, pattern] of FORBIDDEN_RENDERER_PATTERNS) {
      if (pattern.test(source)) violations.push(`${path.relative(process.cwd(), file)}: ${label}`);
    }
  }
  if (violations.length) throw new Error(`Strict CSP source violations:\n${violations.join("\n")}`);
}

async function main() {
  await validateRendererSources();
  const indexPath = path.resolve(process.argv[2] ?? path.join("dist", "index.html"));
  assertStrictProductionCspHtml(await readFile(indexPath, "utf8"), path.relative(process.cwd(), indexPath));
  console.log("Renderer CSP validation passed (strict production policy, no inline-style source patterns).");
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
