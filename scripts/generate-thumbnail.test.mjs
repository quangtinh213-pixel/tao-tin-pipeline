import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {findLatestVideo} from './generate-thumbnail.mjs';

describe('generate-thumbnail module', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thumb-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  it('findLatestVideo returns null for empty or non-existent dir', () => {
    expect(findLatestVideo(path.join(tempDir, 'non-existent'))).toBeNull();
    expect(findLatestVideo(tempDir)).toBeNull();
  });

  it('findLatestVideo ignores dot-directories and returns latest modified directory', async () => {
    const dirA = path.join(tempDir, 'video-a');
    const dirB = path.join(tempDir, 'video-b');
    const dirDot = path.join(tempDir, '.hidden');

    fs.mkdirSync(dirA);
    fs.mkdirSync(dirDot);
    // Ensure mtime difference
    await new Promise((r) => setTimeout(r, 20));
    fs.mkdirSync(dirB);

    const latest = findLatestVideo(tempDir);
    expect(latest).toBe('video-b');
  });
});
