import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const entries = await readdir(context.appOutDir, { withFileTypes: true });
  const appBundle = entries.find((entry) => entry.isDirectory() && entry.name.endsWith(".app"));

  if (!appBundle) {
    throw new Error(`ContaMì macOS bundle not found in ${context.appOutDir}`);
  }

  const plistPath = path.join(context.appOutDir, appBundle.name, "Contents", "Info.plist");

  await execFileAsync("plutil", [
    "-replace",
    "NSAppTransportSecurity.NSAllowsArbitraryLoads",
    "-bool",
    "false",
    plistPath,
  ]);
  await execFileAsync("plutil", [
    "-replace",
    "NSAppTransportSecurity.NSAllowsLocalNetworking",
    "-bool",
    "false",
    plistPath,
  ]);
  await execFileAsync("plutil", [
    "-remove",
    "NSAppTransportSecurity.NSExceptionDomains",
    plistPath,
  ]);
}
