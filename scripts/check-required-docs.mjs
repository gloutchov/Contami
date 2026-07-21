import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";

const required = [
  "README.md", "ISTRUZIONI.md", "INSTRUCTIONS.md", "SECURITY_MODEL.md", "PLAN.md",
  "MAP.md", "AGENTS.md", "LICENSE", "QUICK-START_Desktop.md",
];
await Promise.all(required.map((file) => access(file)));

const manifest = JSON.parse(await readFile("package.json", "utf8"));
if (manifest.license !== "Apache-2.0" || manifest.private !== true) throw new Error("package.json license/private policy mismatch");
if (!manifest.engines?.node) throw new Error("Node.js engine requirement is missing");
const approvedInstallScripts = Object.entries(manifest.allowScripts ?? {}).filter(([, approved]) => approved).map(([name]) => name).sort();
const expectedInstallScripts = ["electron-winstaller@5.4.0", "esbuild@0.28.1"];
if (JSON.stringify(approvedInstallScripts) !== JSON.stringify(expectedInstallScripts)) {
  throw new Error(`Install-script allowlist mismatch: ${JSON.stringify(approvedInstallScripts)}`);
}
if (manifest.build?.asar !== true) throw new Error("Electron packages must keep asar enabled");
const packagedFiles = manifest.build?.files ?? [];
const allowedPackageRoots = new Set(["dist/**/*", "dist-electron/**/*", "package.json"]);
if (packagedFiles.some((entry) => typeof entry !== "string" || !allowedPackageRoots.has(entry))) {
  throw new Error(`Unexpected Electron package file scope: ${JSON.stringify(packagedFiles)}`);
}
const extraResources = manifest.build?.extraResources ?? [];
if (extraResources.some((entry) => typeof entry?.from !== "string" || entry.from.startsWith("sources/") || /\.(numbers|xlsx|pem|key|p12)$/i.test(entry.from))) {
  throw new Error("Private or sensitive extraResources entry configured");
}

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const forbidden = tracked.filter((file) => file.startsWith("sources/") || /\.(numbers|xlsx|pem|key|p12)$/i.test(file));
if (forbidden.length) throw new Error(`Private or sensitive artifacts are tracked: ${forbidden.join(", ")}`);

const workflowText = await Promise.all([".github/workflows/ci.yml", ".github/workflows/release.yml"].map((file) => readFile(file, "utf8")));
const mutableActions = workflowText.flatMap((text) => [...text.matchAll(/uses:\s+[^\s@]+@([^\s#]+)/g)].map((match) => match[1]))
  .filter((reference) => !/^[0-9a-f]{40}$/.test(reference));
if (mutableActions.length) throw new Error(`GitHub Actions must be pinned to commit SHAs: ${mutableActions.join(", ")}`);

console.log(`Documentation and repository hygiene checks passed (${required.length} required documents).`);
