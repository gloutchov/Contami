import { execFile } from "node:child_process";
import { access, mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const root = path.resolve(process.argv[2] ?? path.join("release", manifest.version));

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

async function waitUntil(predicate, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out while waiting for the installed-package state change");
}

function ensureTemporaryPath(candidate, temporaryRoot) {
  const relative = path.relative(path.resolve(temporaryRoot), path.resolve(candidate));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to operate outside the temporary smoke-test root: ${candidate}`);
  }
}

async function runSmoke(executable) {
  await execFileAsync(executable, ["--contami-smoke-test"], {
    timeout: 30_000,
    windowsHide: true,
    maxBuffer: 64 * 1024,
  });
}

async function smokeWindows(temporaryRoot, files) {
  const installer = files.find((file) => /Contami-[^\\/]+-win-x64\.exe$/i.test(file));
  if (!installer) throw new Error(`Windows installer not found under ${root}`);

  const installDirectory = path.join(temporaryRoot, "installed");
  ensureTemporaryPath(installDirectory, temporaryRoot);
  await execFileAsync(installer, ["/S", `/D=${installDirectory}`], {
    timeout: 120_000,
    windowsHide: true,
    maxBuffer: 64 * 1024,
  });

  const executable = path.join(installDirectory, "Contami.exe");
  await waitUntil(() => exists(executable));
  await runSmoke(executable);

  const installedFiles = await collectFiles(installDirectory);
  const uninstaller = installedFiles.find((file) => /^Uninstall.*\.exe$/i.test(path.basename(file)));
  if (!uninstaller) throw new Error(`ContaMì uninstaller not found under ${installDirectory}`);
  await execFileAsync(uninstaller, ["/S"], {
    timeout: 120_000,
    windowsHide: true,
    maxBuffer: 64 * 1024,
  });
  await waitUntil(async () => !(await exists(installDirectory)));
}

async function smokeMac(temporaryRoot, files) {
  const architecture = process.arch === "arm64" ? "arm64" : "x64";
  const dmg = files.find((file) => new RegExp(`Contami-[^/]+-mac-${architecture}\\.dmg$`, "i").test(file.replaceAll("\\", "/")));
  if (!dmg) throw new Error(`macOS ${architecture} DMG not found under ${root}`);

  const mountPoint = path.join(temporaryRoot, "mount");
  const installDirectory = path.join(temporaryRoot, "Applications");
  const installedApp = path.join(installDirectory, "Contami.app");
  ensureTemporaryPath(mountPoint, temporaryRoot);
  ensureTemporaryPath(installedApp, temporaryRoot);
  await mkdir(mountPoint);
  await mkdir(installDirectory);

  let mounted = false;
  try {
    await execFileAsync("hdiutil", ["attach", "-nobrowse", "-readonly", "-mountpoint", mountPoint, dmg], {
      timeout: 60_000,
      maxBuffer: 64 * 1024,
    });
    mounted = true;
    const mountedEntries = await readdir(mountPoint, { withFileTypes: true });
    const sourceApp = mountedEntries.find((entry) => entry.isDirectory() && entry.name.endsWith(".app"));
    if (!sourceApp) throw new Error(`No application bundle found in ${dmg}`);
    await execFileAsync("ditto", [path.join(mountPoint, sourceApp.name), installedApp], {
      timeout: 60_000,
      maxBuffer: 64 * 1024,
    });
    await runSmoke(path.join(installedApp, "Contents", "MacOS", "Contami"));
    await rm(installedApp, { recursive: true, force: true });
    if (await exists(installedApp)) throw new Error(`Installed app still exists after removal: ${installedApp}`);
  } finally {
    if (mounted) {
      await execFileAsync("hdiutil", ["detach", mountPoint], { timeout: 60_000, maxBuffer: 64 * 1024 });
    }
  }
}

if (!new Set(["win32", "darwin"]).has(process.platform)) {
  throw new Error(`Installed-package smoke test is supported only on macOS and Windows, received ${process.platform}`);
}

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "contami-installed-smoke-"));
try {
  const files = await collectFiles(root);
  if (process.platform === "win32") await smokeWindows(temporaryRoot, files);
  else await smokeMac(temporaryRoot, files);
  console.log(`Installed-package smoke test passed on ${process.platform}: install, launch, and removal verified.`);
} finally {
  ensureTemporaryPath(temporaryRoot, os.tmpdir());
  await rm(temporaryRoot, { recursive: true, force: true });
}
