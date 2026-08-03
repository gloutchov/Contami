import { readFile } from "node:fs/promises";
import semver from "semver";

const baselineFile = ".node-version";
const workflowFiles = [".github/workflows/ci.yml", ".github/workflows/release.yml"];
const documentationFiles = ["AGENTS.md", "README.md", "ISTRUZIONI.md", "INSTRUCTIONS.md"];

const [baselineText, manifestText, lockfileText, ...remainingText] = await Promise.all([
  baselineFile,
  "package.json",
  "package-lock.json",
  ...workflowFiles,
  ...documentationFiles,
].map((file) => readFile(file, "utf8")));

const baseline = baselineText.trim();
if (!semver.valid(baseline)) {
  throw new Error(`${baselineFile} must contain one exact stable Node.js version; received ${JSON.stringify(baseline)}`);
}

const manifest = JSON.parse(manifestText);
const lockfile = JSON.parse(lockfileText);
const engineRange = manifest.engines?.node;
if (typeof engineRange !== "string" || !semver.satisfies(baseline, engineRange)) {
  throw new Error(`Node.js baseline ${baseline} does not satisfy package.json engines ${JSON.stringify(engineRange)}`);
}
if (lockfile.packages?.[""]?.engines?.node !== engineRange) {
  throw new Error("package-lock.json does not mirror the package.json Node.js engine requirement");
}

const directDependencies = {
  ...manifest.dependencies,
  ...manifest.devDependencies,
};
const incompatible = [];
for (const name of Object.keys(directDependencies).sort()) {
  const dependencyRange = lockfile.packages?.[`node_modules/${name}`]?.engines?.node;
  if (typeof dependencyRange === "string" && !semver.satisfies(baseline, dependencyRange)) {
    incompatible.push(`${name}: ${dependencyRange}`);
  }
}
if (incompatible.length) {
  throw new Error(`Node.js baseline ${baseline} does not satisfy direct dependencies: ${incompatible.join(", ")}`);
}

const workflowText = remainingText.slice(0, workflowFiles.length);
for (const [index, text] of workflowText.entries()) {
  if (!text.includes(`node-version-file: ${baselineFile}`) || /\bnode-version\s*:/.test(text)) {
    throw new Error(`${workflowFiles[index]} must use node-version-file: ${baselineFile} without a separate node-version value`);
  }
}

const documentationText = remainingText.slice(workflowFiles.length);
for (const [index, text] of documentationText.entries()) {
  if (!text.includes(baseline)) {
    throw new Error(`${documentationFiles[index]} must document the Node.js ${baseline} baseline`);
  }
}

if (!semver.satisfies(process.version, engineRange)) {
  throw new Error(`Current runtime ${process.version} does not satisfy package.json engines ${engineRange}`);
}

console.log(`Node.js baseline ${baseline} satisfies the project, direct dependencies, CI, and documentation.`);
