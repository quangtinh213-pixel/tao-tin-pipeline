import {describe, expect, it} from 'vitest';
import {access, readFile} from 'node:fs/promises';
import {join} from 'node:path';

const rootDir = process.cwd();

async function readProjectFile(relativePath) {
  const absolutePath = join(rootDir, relativePath);
  await access(absolutePath);
  return readFile(absolutePath, 'utf8');
}

describe('workflow caption documentation contract', () => {
  it('documents the caption SOP and local generation commands', async () => {
    const sop = await readProjectFile('docs/gen-video/caption-sop.md');
    expect(sop).toContain('Bóc tách');
    expect(sop).toContain('100–180');
    expect(sop).toContain('Hook');
    expect(sop).toContain('Content');
    expect(sop).toContain('CTA');
    expect(sop).toContain('#VnNews213');
    expect(sop).toContain('giới trẻ Việt Nam');
  });

  it('places caption generation after Spec and before Coder in canonical docs', async () => {
    const router = await readProjectFile('docs/SKILL-GEN-VIDEO.md');
    const common = await readProjectFile('docs/gen-video/common-pipeline.md');
    const captionIndex = router.indexOf('### Caption');
    const coderIndex = router.indexOf('### Step 7: Coder');

    expect(captionIndex).toBeGreaterThan(-1);
    expect(coderIndex).toBeGreaterThan(captionIndex);
    expect(router).toContain('caption-sop.md');
    expect(router).toContain('generate-caption.mjs');
    expect(router).toContain('validate-caption.mjs');
    expect(router).toContain('caption.txt');
    expect(common).toContain('caption.txt');
    expect(common).toContain('generate-caption.mjs');
    expect(common).toContain('#VnNews213');
  });

  it('lists caption.txt and dashboard copy behavior in project-facing docs', async () => {
    const agents = await readProjectFile('AGENTS.md');
    const readme = await readProjectFile('README.md');

    expect(agents).toContain('caption.txt');
    expect(agents).toContain('Caption');
    expect(readme).toContain('caption.txt');
    expect(readme).toContain('Sao chép caption');
    expect(readme).toContain('generate-caption.mjs');
  });
});
