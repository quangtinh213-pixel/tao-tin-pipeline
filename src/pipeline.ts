import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { deriveSlug } from './slug';
import { loadConfig, type VideoConfig } from './config';

export type PipelineStep = 'setup' | 'planner' | 'spec' | 'coder' | 'render';

export const PIPELINE_STEPS: PipelineStep[] = ['setup', 'planner', 'spec', 'coder', 'render'];

export interface PipelineContext {
  context: string;
  slug: string;
  config: VideoConfig;
  videosDir: string;
}

export function createPipelineContext(context: string, rootDir: string = process.cwd()): PipelineContext {
  if (!context.trim()) {
    throw new Error(
      'Error: context is required. Usage: /gen-video [--template <id>] [--audio=<mode>] <context>',
    );
  }

  const slug = deriveSlug(context);
  const config = loadConfig();
  const videosDir = join(rootDir, 'videos', slug);

  if (existsSync(videosDir)) {
    throw new Error(`Conflict: directory already exists: videos/${slug}`);
  }

  return { context, slug, config, videosDir };
}

export function setupDirectories(ctx: PipelineContext): void {
  mkdirSync(join(ctx.videosDir, 'output'), { recursive: true });
  writeFileSync(join(ctx.videosDir, 'context.txt'), ctx.context, 'utf-8');
}

export async function executePipeline(
  context: string,
  stepExecutor: (step: PipelineStep, ctx: PipelineContext) => Promise<void>,
  rootDir: string = process.cwd()
): Promise<string> {
  const ctx = createPipelineContext(context, rootDir);
  setupDirectories(ctx);

  for (const step of PIPELINE_STEPS) {
    await stepExecutor(step, ctx);
  }

  return `Pipeline complete. Output: videos/${ctx.slug}/output/video.mp4`;
}
