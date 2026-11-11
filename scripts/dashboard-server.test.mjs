import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createDashboardServer} from './dashboard.mjs';

let rootDir;
let server;

beforeEach(async () => {
  rootDir = await mkdtemp(join(tmpdir(), 'dashboard-server-'));
  const videoDir = join(rootDir, 'videos', 'rendered-story');
  await mkdir(join(videoDir, 'output'), {recursive: true});
  await mkdir(join(videoDir, 'script'), {recursive: true});
  await writeFile(join(videoDir, 'output', 'video.mp4'), 'video');
  await writeFile(join(videoDir, 'template.txt'), 'news/media-showcase\n');
  await writeFile(
    join(videoDir, 'spec.json'),
    JSON.stringify({
      templateId: 'news/media-showcase',
      video: {title: 'Rendered story', date: '19.09.2026'},
      source: {publisher: 'Example News'},
    }),
  );
  await writeFile(
    join(videoDir, 'script', 'script.json'),
    JSON.stringify({script: [{text: 'Hook'}, {text: 'Body'}]}),
  );
  await writeFile(join(videoDir, 'caption.txt'), '🔴 Caption body #VnNews213\n');
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  }
  await rm(rootDir, {recursive: true, force: true});
});

async function startServer(options = {}) {
  server = createDashboardServer({rootDir, ...options});
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

describe('dashboard HTTP server', () => {
  it('returns rendered video records and a requested script', async () => {
    const baseUrl = await startServer();

    const listResponse = await fetch(`${baseUrl}/api/videos`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.headers.get('content-type')).toContain('application/json');
    expect((await listResponse.json()).videos[0].slug).toBe('rendered-story');

    const scriptResponse = await fetch(`${baseUrl}/api/videos/rendered-story/script`);
    expect(scriptResponse.status).toBe(200);
    expect((await scriptResponse.json()).script).toBe('Hook\n\nBody');

    const captionResponse = await fetch(`${baseUrl}/api/videos/rendered-story/caption`);
    expect(captionResponse.status).toBe(200);
    expect((await captionResponse.json()).caption).toBe('🔴 Caption body #VnNews213');
  });

  it('reveals a validated video path through the injected Finder launcher', async () => {
    const revealed = [];
    const baseUrl = await startServer({
      finder: async (videoPath) => revealed.push(videoPath),
    });

    const response = await fetch(`${baseUrl}/api/videos/rendered-story/reveal`, {
      method: 'POST',
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ok: true});
    expect(revealed).toEqual([
      join(rootDir, 'videos', 'rendered-story', 'output', 'video.mp4'),
    ]);
  });

  it('returns 422 when a rendered video has no caption artifact', async () => {
    await rm(join(rootDir, 'videos', 'rendered-story', 'caption.txt'));
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/api/videos/rendered-story/caption`);
    expect(response.status).toBe(422);
    expect((await response.json()).error).toMatch(/caption is unavailable/i);
  });

  it('returns safe JSON errors for missing records, traversal, and unknown routes', async () => {
    const baseUrl = await startServer();

    const missingResponse = await fetch(`${baseUrl}/api/videos/missing-story/script`);
    expect(missingResponse.status).toBe(404);
    expect((await missingResponse.json()).error).toMatch(/not found/i);

    const missingCaptionResponse = await fetch(`${baseUrl}/api/videos/missing-story/caption`);
    expect(missingCaptionResponse.status).toBe(404);

    const traversalResponse = await fetch(
      `${baseUrl}/api/videos/%2E%2E%2Foutside/reveal`,
      {method: 'POST'},
    );
    expect(traversalResponse.status).toBe(400);
    expect((await traversalResponse.json()).error).toMatch(/invalid slug/i);

    const captionTraversalResponse = await fetch(
      `${baseUrl}/api/videos/%2E%2E%2Foutside/caption`,
    );
    expect(captionTraversalResponse.status).toBe(400);

    const unknownResponse = await fetch(`${baseUrl}/api/unknown`);
    expect(unknownResponse.status).toBe(404);
    expect((await unknownResponse.json()).error).toMatch(/not found/i);
  });

  it('supports retrying a job via POST /api/jobs/:id/retry', async () => {
    let shouldFail = true;
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-key';
    try {
      const baseUrl = await startServer({
        runner: async (job, projectRoot) => {
          if (shouldFail) throw new Error('First run failed');
          await writeFile(join(projectRoot, 'videos', job.slug, 'output', 'video.mp4'), 'ok');
        },
      });

      await mkdir(join(rootDir, 'src', 'templates'), {recursive: true});
      await writeFile(
        join(rootDir, 'src', 'templates', 'registry.ts'),
        `export const TEMPLATE_REGISTRY = [
          {id: "creative/free-style", behavior: "creative", name: "Free Style", description: "Creative"},
        ];`,
      );

      const createRes = await fetch(`${baseUrl}/api/jobs`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({context: 'Job test retry', templateId: 'creative/free-style', audioMode: 'voice-only'}),
      });
      const {job} = await createRes.json();

      // Wait for it to fail
      for (let i = 0; i < 100; i += 1) {
        const check = await fetch(`${baseUrl}/api/jobs/${job.id}`);
        const data = await check.json();
        if (data.job.status === 'failed') break;
        await new Promise((r) => setTimeout(r, 20));
      }

      shouldFail = false;
      const retryRes = await fetch(`${baseUrl}/api/jobs/${job.id}/retry`, {method: 'POST'});
      expect(retryRes.status).toBe(202);
      const retried = await retryRes.json();
      expect(['queued', 'running']).toContain(retried.job.status);
    } finally {
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });
});
