import { execSync } from 'child_process';
import { existsSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';

export type Platform = 'macos' | 'windows' | 'linux';
export type LinuxDistro = 'debian' | 'fedora' | 'arch' | 'unknown';

// ─── Platform detection ───────────────────────────────────────────────────────

export function detectPlatform(): Platform {
  if (process.platform === 'darwin') return 'macos';
  if (process.platform === 'win32') return 'windows';
  return 'linux';
}

export function detectLinuxDistro(): LinuxDistro {
  try {
    const osRelease = readFileSync('/etc/os-release', 'utf-8').toLowerCase();
    if (osRelease.includes('ubuntu') || osRelease.includes('debian')) return 'debian';
    if (osRelease.includes('fedora') || osRelease.includes('rhel') || osRelease.includes('centos')) return 'fedora';
    if (osRelease.includes('arch') || osRelease.includes('manjaro')) return 'arch';
  } catch {
    // /etc/os-release not found — try lsb_release
    try {
      const lsb = execSync('lsb_release -i -s', { encoding: 'utf-8' }).toLowerCase().trim();
      if (lsb.includes('ubuntu') || lsb.includes('debian')) return 'debian';
      if (lsb.includes('fedora') || lsb.includes('centos') || lsb.includes('rhel')) return 'fedora';
      if (lsb.includes('arch')) return 'arch';
    } catch { /* ignore */ }
  }
  return 'unknown';
}

// ─── Command availability ─────────────────────────────────────────────────────

export function isCommandAvailable(command: string): boolean {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function getNodeVersion(): number | null {
  // Try both 'node' and 'node18' (some Linux distros use versioned binaries)
  for (const bin of ['node', 'node18', 'nodejs']) {
    try {
      const version = execSync(`${bin} --version`, { encoding: 'utf-8' }).trim();
      const match = version.match(/^v(\d+)/);
      if (match) return parseInt(match[1], 10);
    } catch { /* try next */ }
  }
  return null;
}

export function isSupportedNodeVersion(version: number): boolean {
  return version === 20 || version === 22 || version === 24;
}

// ─── Install command lists ────────────────────────────────────────────────────

export function getInstallCommands(dep: string, platform: Platform): string[][] {
  // Returns array of [cmd, ...args] arrays — each is one atomic command
  // Multiple entries = fallback chain (try first, if fail try next)
  const distro = platform === 'linux' ? detectLinuxDistro() : 'unknown';

  const map: Record<string, Record<Platform, string[][]>> = {
    brew: {
      macos: [
        ['/bin/bash', '-c', '$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)'],
      ],
      linux: [],
      windows: [],
    },

    ffmpeg: {
      macos: [
        ['brew', 'install', 'ffmpeg'],
      ],
      linux: distro === 'debian' ? [
        ['sudo', 'apt-get', 'update'],
        ['sudo', 'apt-get', 'install', '-y', 'ffmpeg'],
      ] : distro === 'fedora' ? [
        ['sudo', 'dnf', 'install', '-y', 'ffmpeg'],
      ] : distro === 'arch' ? [
        ['sudo', 'pacman', '-S', '--noconfirm', 'ffmpeg'],
      ] : [
        // unknown distro — try all common package managers
        ['sudo', 'apt-get', 'install', '-y', 'ffmpeg'],
        ['sudo', 'dnf', 'install', '-y', 'ffmpeg'],
        ['sudo', 'pacman', '-S', '--noconfirm', 'ffmpeg'],
      ],
      windows: [
        ['winget', 'install', '--id', 'Gyan.FFmpeg', '-e', '--accept-source-agreements', '--accept-package-agreements'],
        ['choco', 'install', 'ffmpeg', '-y'],
      ],
    },

    node: {
      macos: [
        ['brew', 'install', 'node'],
      ],
      linux: distro === 'debian' ? [
        // Use NodeSource for a supported Node.js release on Debian/Ubuntu
        ['sudo', 'apt-get', 'update'],
        ['sudo', 'apt-get', 'install', '-y', 'ca-certificates', 'curl', 'gnupg'],
        ['bash', '-c', 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -'],
        ['sudo', 'apt-get', 'install', '-y', 'nodejs'],
      ] : distro === 'fedora' ? [
        ['sudo', 'dnf', 'module', 'enable', '-y', 'nodejs:20'],
        ['sudo', 'dnf', 'install', '-y', 'nodejs', 'npm'],
      ] : distro === 'arch' ? [
        ['sudo', 'pacman', '-S', '--noconfirm', 'nodejs', 'npm'],
      ] : [
        // unknown distro fallback
        ['bash', '-c', 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -'],
        ['sudo', 'apt-get', 'install', '-y', 'nodejs'],
      ],
      windows: [
        ['winget', 'install', '--id', 'OpenJS.NodeJS.LTS', '-e', '--accept-source-agreements', '--accept-package-agreements'],
        ['choco', 'install', 'nodejs-lts', '-y'],
      ],
    },
  };

  return map[dep]?.[platform] ?? [];
}

// ─── Execution helpers ────────────────────────────────────────────────────────

export interface InstallResult {
  success: boolean;
  output: string;
}

function runCommand(args: string[]): { success: boolean; output: string } {
  try {
    const output = execSync(args.join(' '), {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { success: true, output: output as string };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: msg };
  }
}

export function autoInstallDependency(dep: string, platform: Platform): InstallResult {
  const commandGroups = getInstallCommands(dep, platform);

  if (commandGroups.length === 0) {
    return { success: false, output: `No install commands defined for ${dep} on ${platform}` };
  }

  // For deps that need multiple sequential commands (e.g. apt-get update THEN apt-get install),
  // group them: if any command in a group fails, try the next group.
  // Groups are separated by the fact that debian/fedora/arch each return their own array.
  // For simplicity: run all commands in sequence; if any fails, report but continue.
  let lastError = '';
  for (const cmdArgs of commandGroups) {
    const result = runCommand(cmdArgs);
    if (!result.success) {
      lastError = result.output;
      // For sequential commands (like apt-get update + apt-get install),
      // a failure in one step means we should stop this group
      // but we still try the next group if available
    }
  }

  // Verify the dep is now available
  const verifyCmd = dep === 'node' ? 'node' : dep === 'brew' ? 'brew' : dep;
  if (isCommandAvailable(verifyCmd) || (dep === 'node' && getNodeVersion() !== null)) {
    return { success: true, output: `${dep} installed successfully` };
  }

  return { success: false, output: `${dep} install commands ran but ${dep} is still not available. Last error: ${lastError}` };
}

// ─── Main setup orchestrator ──────────────────────────────────────────────────

export function setupAutoInstall(rootDir: string = process.cwd()): void {
  const platform = detectPlatform();
  console.log(`\n🔍 Detected platform: ${platform}`);

  if (platform === 'linux') {
    const distro = detectLinuxDistro();
    console.log(`   Linux distro: ${distro}`);
  }

  // ── Step 1: macOS — ensure Homebrew is available ──────────────────────────
  if (platform === 'macos' && !isCommandAvailable('brew')) {
    console.log('\n📦 Installing Homebrew...');
    const result = autoInstallDependency('brew', platform);
    if (!result.success) {
      throw new Error(
        'Failed to install Homebrew automatically.\n' +
        'Please install manually: https://brew.sh\n' +
        `Error: ${result.output}`
      );
    }
    console.log('   ✅ Homebrew installed');
  }

  // ── Step 2: Node.js supported by the pinned Playwright toolchain ──────────
  const nodeVersion = getNodeVersion();
  if (nodeVersion === null) {
    console.log('\n📦 Node.js not found. Installing...');
    const result = autoInstallDependency('node', platform);
    if (!result.success) {
      throw new Error(
        `Failed to auto-install Node.js on ${platform}.\n` +
        'Please install manually: https://nodejs.org\n' +
        `Error: ${result.output}`
      );
    }
    console.log('   ✅ Node.js installed');
  } else if (!isSupportedNodeVersion(nodeVersion)) {
    console.log(`\n⚠️  Node.js v${nodeVersion} found but v20, v22, or v24 is required. Upgrading...`);
    const result = autoInstallDependency('node', platform);
    if (!result.success) {
      throw new Error(
        `Node.js upgrade failed. Current version: v${nodeVersion}, required: v20, v22, or v24.\n` +
        'Please upgrade manually: https://nodejs.org\n' +
        `Error: ${result.output}`
      );
    }
    console.log('   ✅ Node.js upgraded');
  } else {
    console.log(`\n✅ Node.js v${nodeVersion} — OK`);
  }

  // ── Step 3: ffmpeg ────────────────────────────────────────────────────────
  if (!isCommandAvailable('ffmpeg')) {
    console.log('\n📦 ffmpeg not found. Installing...');
    const result = autoInstallDependency('ffmpeg', platform);
    if (!result.success) {
      throw new Error(
        `Failed to auto-install ffmpeg on ${platform}.\n` +
        'Please install manually:\n' +
        '  macOS:  brew install ffmpeg\n' +
        '  Linux:  sudo apt install ffmpeg\n' +
        '  Windows: winget install Gyan.FFmpeg\n' +
        `Error: ${result.output}`
      );
    }
    console.log('   ✅ ffmpeg installed');
  } else {
    console.log('✅ ffmpeg — OK');
  }

  // ── Step 4: npm install ───────────────────────────────────────────────────
  console.log('\n📦 Running npm install...');
  try {
    execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  } catch {
    throw new Error('npm install failed. Check the error output above.');
  }

  // ── Step 5: Install the matching Playwright Chromium binary ───────────────
  console.log('\n📦 Installing Playwright Chromium...');
  try {
    const playwrightCommand = platform === 'linux' && detectLinuxDistro() === 'debian'
      ? 'npx playwright install --with-deps chromium'
      : 'npx playwright install chromium';
    execSync(playwrightCommand, {cwd: rootDir, stdio: 'inherit'});
  } catch {
    throw new Error(
      'Playwright Chromium installation failed.\n' +
      'On supported Linux distributions, ensure sudo access is available.\n' +
      'Then retry the appropriate npx playwright install command.'
    );
  }

  // ── Step 6: Verify toolchain ──────────────────────────────────────────────
  console.log('\n🔍 Verifying toolchain...');
  try {
    const playwrightVer = execSync('npx playwright --version', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
    const installedBrowsers = execSync('npx playwright install --list', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    if (!installedBrowsers.toLowerCase().includes('chromium')) {
      throw new Error('Chromium is missing from the Playwright browser list');
    }
    const remotionVersions = execSync('npx remotion versions', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
    execSync('npx tsc --noEmit', {cwd: rootDir, stdio: 'inherit'});
    execSync('npm test', {cwd: rootDir, stdio: 'inherit'});
    console.log(`   ✅ ${playwrightVer}`);
    console.log('   ✅ Playwright Chromium installed');
    console.log('   ✅ Remotion package versions are valid');
    console.log(remotionVersions);
    console.log('   ✅ TypeScript and tests passed');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      'Toolchain verification failed after installation.\n' +
      `Error: ${detail}`
    );
  }

  // ── Step 7: Create .env if missing ───────────────────────────────────────
  const envPath = join(rootDir, '.env');
  const envExamplePath = join(rootDir, '.env.example');
  if (!existsSync(envPath)) {
    if (existsSync(envExamplePath)) {
      copyFileSync(envExamplePath, envPath);
      console.log('\n✅ Created .env from .env.example');
    } else {
      console.warn('\n⚠️  .env.example not found — skipping .env creation');
    }
  } else {
    console.log('✅ .env — already exists');
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const nodeVer = execSync('node --version', { encoding: 'utf-8' }).trim();
  const npmVer = execSync('npm --version', { encoding: 'utf-8' }).trim();
  let ffmpegVer = 'unknown';
  try {
    ffmpegVer = execSync('ffmpeg -version', { encoding: 'utf-8' }).split('\n')[0].trim();
  } catch { /* ignore */ }

  console.log('\n' + '─'.repeat(40));
  console.log('✅ Setup complete!');
  console.log(`   OS:       ${platform}`);
  console.log(`   Node.js:  ${nodeVer}`);
  console.log(`   npm:      v${npmVer}`);
  console.log(`   ffmpeg:   ${ffmpegVer}`);
  console.log('─'.repeat(40));
  console.log('\nNext step: /gen-video <your topic>');
}
