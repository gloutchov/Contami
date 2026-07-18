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

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const forbidden = tracked.filter((file) => file.startsWith("sources/") || /\.(numbers|xlsx|pem|key|p12)$/i.test(file));
if (forbidden.length) throw new Error(`Private or sensitive artifacts are tracked: ${forbidden.join(", ")}`);

console.log(`Documentation and repository hygiene checks passed (${required.length} required documents).`);
