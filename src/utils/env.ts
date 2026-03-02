/**
 * Environment utilities for OnyxMind.
 *
 * GUI apps like Obsidian have a minimal PATH that often doesn't include
 * user-installed binaries like `opencode`. This module enhances PATH with
 * common binary locations so the OpenCode SDK can spawn the server process.
 */

import * as fs from 'fs';
import * as path from 'path';

const isWindows = process.platform === 'win32';
const PATH_SEPARATOR = isWindows ? ';' : ':';
const OPENCODE_EXECUTABLE = isWindows ? 'opencode.exe' : 'opencode';

function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '';
}

/** Returns common binary directories where `opencode` might be installed. */
function getExtraBinaryPaths(): string[] {
  const home = getHomeDir();

  if (isWindows) {
    const paths: string[] = [];
    const localAppData = process.env.LOCALAPPDATA;
    const appData = process.env.APPDATA;
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';

    if (appData) paths.push(path.join(appData, 'npm'));
    if (localAppData) {
      paths.push(path.join(localAppData, 'Programs', 'nodejs'));
    }
    paths.push(path.join(programFiles, 'nodejs'));

    const voltaHome = process.env.VOLTA_HOME;
    if (voltaHome) paths.push(path.join(voltaHome, 'bin'));
    else if (home) paths.push(path.join(home, '.volta', 'bin'));

    if (home) paths.push(path.join(home, '.local', 'bin'));
    return paths;
  }

  // Unix / macOS
  const paths = [
    '/usr/local/bin',
    '/opt/homebrew/bin',  // macOS ARM Homebrew
    '/usr/bin',
    '/bin',
  ];

  const voltaHome = process.env.VOLTA_HOME;
  if (voltaHome) paths.push(path.join(voltaHome, 'bin'));

  const asdfRoot = process.env.ASDF_DATA_DIR || process.env.ASDF_DIR;
  if (asdfRoot) {
    paths.push(path.join(asdfRoot, 'shims'));
    paths.push(path.join(asdfRoot, 'bin'));
  }

  const fnmMultishell = process.env.FNM_MULTISHELL_PATH;
  if (fnmMultishell) paths.push(fnmMultishell);

  if (home) {
    paths.push(path.join(home, '.local', 'bin'));
    paths.push(path.join(home, '.volta', 'bin'));
    paths.push(path.join(home, '.asdf', 'shims'));
    paths.push(path.join(home, 'go', 'bin'));  // Go binaries (opencode is Go-based)
  }

  return paths;
}

/** Finds the full path to the `opencode` binary, or null if not found. */
export function findOpencodeExecutable(): string | null {
  const searchPaths = [
    ...getExtraBinaryPaths(),
    ...(process.env.PATH || '').split(PATH_SEPARATOR),
  ];

  for (const dir of searchPaths) {
    if (!dir) continue;
    try {
      const execPath = path.join(dir, OPENCODE_EXECUTABLE);
      if (fs.existsSync(execPath) && fs.statSync(execPath).isFile()) {
        return execPath;
      }
    } catch {
      // Inaccessible directory, skip
    }
  }

  return null;
}

/**
 * Returns an enhanced PATH string that includes common binary locations.
 * Call this before spawning the OpenCode server so it can find the `opencode` binary.
 */
export function getEnhancedPath(): string {
  const extraPaths = getExtraBinaryPaths().filter(Boolean);
  const currentPath = process.env.PATH || '';
  const currentDirs = currentPath.split(PATH_SEPARATOR).filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const p of [...extraPaths, ...currentDirs]) {
    const key = isWindows ? p.toLowerCase() : p;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }

  return unique.join(PATH_SEPARATOR);
}
