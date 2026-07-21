import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const root = path.resolve(process.argv[2] ?? path.join("release", manifest.version));

async function findExecutables(directory) {
  const matches = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) matches.push(...await findExecutables(fullPath));
    else if (process.platform === "win32" && entry.name === "Contami.exe" && fullPath.includes("win-unpacked")) matches.push(fullPath);
    else if (process.platform === "darwin" && entry.name === "Contami" && fullPath.includes(`${path.sep}Contami.app${path.sep}Contents${path.sep}MacOS${path.sep}`)) matches.push(fullPath);
  }
  return matches;
}

function chooseExecutable(matches) {
  if (process.platform !== "darwin" || matches.length < 2) return matches[0];
  const armCandidate = matches.find((candidate) => /mac(?:-[^\\/]+)*-arm64|mac-arm64/i.test(candidate));
  const x64Candidate = matches.find((candidate) => candidate !== armCandidate);
  return process.arch === "arm64" ? (armCandidate ?? matches[0]) : (x64Candidate ?? matches[0]);
}

if (!new Set(["win32", "darwin"]).has(process.platform)) {
  throw new Error(`Packaged smoke test is supported only on macOS and Windows, received ${process.platform}`);
}

const executable = chooseExecutable(await findExecutables(root));
if (!executable) throw new Error(`No packaged ContaMì executable found under ${root}`);

await execFileAsync(executable, ["--contami-smoke-test"], {
  timeout: 30_000,
  windowsHide: true,
  maxBuffer: 64 * 1024,
});
console.log(`Packaged smoke test passed: ${path.basename(executable)}`);
