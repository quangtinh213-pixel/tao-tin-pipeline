import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createProductionManager, isTransientAgentError, scanTemplateOptions} from './dashboard-production.mjs';

let rootDir;
let previousKey;

beforeEach(async () => {
  previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  rootDir = await mkdtemp(join(tmpdir(), 'dashboard-production-'));
  await mkdir(join(rootDir, 'src', 'templates'), {recursive: true});
  await writeFile(
    join(rootDir, 'src', 'templates', 'registry.ts'),
    `export const TEMPLATE_REGISTRY = [
      {id: "creative/free-style", behavior: "creative", name: "Free Style", description: "Creative"},
      {id: "news/media-showcase", behavior: "fixed", name: "Media Showcase", description: "Article"},
    ];`,
  );
});

afterEach(async () => {
  if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previousKey;
  await rm(rootDir, {recursive: true, force: true});
});

async function waitForJob(manager, id) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const job = manager.getJob(id);
    if (!['queued', 'running'].includes(job.status)) return job;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for job');
}

describe('dashboard production manager', () => {
  it('reads template options from the canonical registry', async () => {
    await expect(scanTemplateOptions(rootDir)).resolves.toEqual([
      {id: 'creative/free-style', behavior: 'creative', name: 'Free Style', description: 'Creative'},
      {id: 'news/media-showcase', behavior: 'fixed', name: 'Media Showcase', description: 'Article'},
    ]);
  });

  it('creates setup artifacts and completes through an injected worker', async () => {
    const manager = createProductionManager({
      rootDir,
      runner: async (job, projectRoot) => {
        await writeFile(join(projectRoot, 'videos', job.slug, 'output', 'video.mp4'), 'video');
      },
    });
    const created = await manager.createJob({
      context: 'Một video thử nghiệm',
      templateId: 'creative/free-style',
      audioMode: 'voice-only',
    });
    const completed = await waitForJob(manager, created.id);

    expect(completed.status).toBe('completed');
    expect(completed.progress).toBe(100);
    await expect(readFile(join(rootDir, 'videos', completed.slug, 'context.txt'), 'utf8'))
      .resolves.toBe('Một video thử nghiệm\n');
    await expect(readFile(join(rootDir, 'videos', completed.slug, 'template.txt'), 'utf8'))
      .resolves.toBe('creative/free-style\n');
    await expect(readFile(join(rootDir, 'videos', completed.slug, 'audio.txt'), 'utf8'))
      .resolves.toBe('voice-only\n');
  });

  it('applies article shortcut defaults and rejects requests without an API key', async () => {
    const manager = createProductionManager({rootDir, runner: async () => {}});
    const articleJob = await manager.createJob({context: 'https://example.com/news/story'});
    expect(articleJob.templateId).toBe('news/media-showcase');
    expect(articleJob.audioMode).toBe('full');
    await waitForJob(manager, articleJob.id);

    delete process.env.OPENAI_API_KEY;
    await expect(manager.createJob({context: 'Another video'})).rejects.toMatchObject({status: 503});
  });

  it('runs multiple jobs concurrently with AssemblyMutex serializing coder/render stage', async () => {
    let runningConcurrent = 0;
    let maxRunningConcurrent = 0;
    let inAssemblyMutex = 0;
    let maxInAssemblyMutex = 0;

    const manager = createProductionManager({
      rootDir,
      maxConcurrent: 2,
      runner: async (job, projectRoot, {assemblyMutex}) => {
        runningConcurrent += 1;
        maxRunningConcurrent = Math.max(maxRunningConcurrent, runningConcurrent);

        // Simulate stages 1-8 running in parallel
        await new Promise((resolve) => setTimeout(resolve, 30));
        runningConcurrent -= 1;

        // Simulate acquiring AssemblyMutex for stages 9-10 (coder/render)
        const release = await assemblyMutex.acquire(job.id);
        inAssemblyMutex += 1;
        maxInAssemblyMutex = Math.max(maxInAssemblyMutex, inAssemblyMutex);

        await new Promise((resolve) => setTimeout(resolve, 30));
        inAssemblyMutex -= 1;
        release();

        await writeFile(join(projectRoot, 'videos', job.slug, 'output', 'video.mp4'), 'mp4');
      },
    });

    const [job1, job2] = await manager.createJobs({
      items: [
        {context: 'Video song song 1', templateId: 'creative/free-style', audioMode: 'voice-only'},
        {context: 'Video song song 2', templateId: 'creative/free-style', audioMode: 'voice-only'},
      ],
    });

    const [res1, res2] = await Promise.all([
      waitForJob(manager, job1.id),
      waitForJob(manager, job2.id),
    ]);

    expect(res1.status).toBe('completed');
    expect(res2.status).toBe('completed');
    // Verify both were executing concurrently during early stages
    expect(maxRunningConcurrent).toBe(2);
    // Verify AssemblyMutex strictly serialized the assembly/render stage to 1 at a time
    expect(maxInAssemblyMutex).toBe(1);
  });

  it('allows retrying a failed job and completes successfully', async () => {
    let shouldFail = true;
    const manager = createProductionManager({
      rootDir,
      runner: async (job, projectRoot) => {
        if (shouldFail) throw new Error('Simulated transient LLM failure');
        await writeFile(join(projectRoot, 'videos', job.slug, 'output', 'video.mp4'), 'mp4');
      },
    });

    const created = await manager.createJob({
      context: 'Video cần thử lại',
      templateId: 'creative/free-style',
      audioMode: 'voice-only',
    });

    const failed = await waitForJob(manager, created.id);
    expect(failed.status).toBe('failed');
    expect(failed.error).toContain('Simulated transient LLM failure');

    // Retry the failed job
    shouldFail = false;
    const retried = await manager.retryJob(created.id);
    expect(['queued', 'running']).toContain(retried.status);

    const completed = await waitForJob(manager, created.id);
    expect(completed.status).toBe('completed');
    expect(completed.error).toBeNull();
  });
});

describe('isTransientAgentError', () => {
  it('treats OpenAI connection errors as transient', () => {
    expect(isTransientAgentError(new Error('Connection error.'))).toBe(true);
    expect(isTransientAgentError(new Error('fetch failed'))).toBe(true);
    expect(isTransientAgentError({status: 503, message: ''})).toBe(true);
    expect(isTransientAgentError({code: 'ECONNRESET', message: ''})).toBe(true);
    expect(isTransientAgentError(new Error('Incorrect API key provided'))).toBe(false);
  });
});
