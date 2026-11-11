import {afterEach, describe, expect, it} from 'vitest';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {buildCaption} from './caption-rules.mjs';
import {generateCaption} from './generate-caption.mjs';

let fixtureRoot;

const metadata = {
  title: 'Cây đổ trúng xe buýt ở TPHCM, một người tử vong',
  date: '18.09.2026',
  publisher: 'VietNamNet News',
  hook: 'Một cây xanh lớn bất ngờ đổ ập xuống xe buýt và xe máy giữa lúc trời mưa ở TPHCM, khiến một người đàn ông tử vong.',
  ending: 'Nguyên nhân cụ thể của vụ việc vẫn đang được cơ quan chức năng điều tra.',
  script: [
    'Một cây xanh lớn bất ngờ đổ ập xuống xe buýt và xe máy giữa lúc trời mưa ở TPHCM, khiến một người đàn ông tử vong.',
    'Vụ việc xảy ra khoảng 18 giờ 25 phút ngày 18 tháng 9 trên đường An Dương Vương, phường Chợ Quán, TPHCM.',
    'Cây đổ trúng đầu xe buýt và một xe máy đang lưu thông gần đó.',
    'Hai người đi trên xe máy bị thương nặng và được lực lượng chức năng đưa đi cấp cứu.',
    'Một nạn nhân tử vong sau đó tại bệnh viện, người còn lại tiếp tục được điều trị.',
    'Theo thông tin ban đầu, nhánh cây có đường kính khoảng 20 centimet.',
    'Các đơn vị nghiệp vụ đang khám nghiệm hiện trường và điều tra nguyên nhân.',
  ],
};

afterEach(async () => {
  if (fixtureRoot) await rm(fixtureRoot, {recursive: true, force: true});
  fixtureRoot = undefined;
});

async function createVideoFixture(rootDir, slug = 'story') {
  const videoDir = join(rootDir, 'videos', slug);
  await mkdir(join(videoDir, 'script'), {recursive: true});
  await mkdir(join(videoDir, 'output'), {recursive: true});
  await writeFile(join(videoDir, 'output', 'video.mp4'), 'video');
  await writeFile(join(videoDir, 'spec.json'), JSON.stringify({
    video: {title: metadata.title, date: metadata.date},
    source: {publisher: metadata.publisher},
  }));
  await writeFile(join(videoDir, 'plan.json'), JSON.stringify({
    title: metadata.title,
    hook: metadata.hook,
    ending: metadata.ending,
  }));
  await writeFile(join(videoDir, 'script', 'script.json'), JSON.stringify({
    script: metadata.script.map((text, index) => ({text, type: index === 0 ? 'hook' : index === metadata.script.length - 1 ? 'ending' : 'body'})),
  }));
  return videoDir;
}

function runNode(args) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, args, {cwd: process.cwd()});
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolvePromise({code, stdout, stderr}));
  });
}

describe('caption generation and validation CLIs', () => {
  it('generates a caption before the render output exists', async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'caption-cli-pre-render-'));
    const videoDir = await createVideoFixture(fixtureRoot);
    await rm(join(videoDir, 'output', 'video.mp4'));

    const outputPath = await generateCaption(fixtureRoot, 'story');

    expect(outputPath).toBe(resolve(fixtureRoot, 'videos', 'story', 'caption.txt'));
    await expect(readFile(outputPath, 'utf8')).resolves.toContain('#VnNews213');
  });

  it('generates one caption, reuses a valid caption, and overwrites with force', async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'caption-cli-'));
    const videoDir = await createVideoFixture(fixtureRoot);

    const outputPath = await generateCaption(fixtureRoot, 'story');
    expect(outputPath).toBe(resolve(fixtureRoot, 'videos', 'story', 'caption.txt'));
    const generated = await readFile(outputPath, 'utf8');
    expect(generated).toContain('#VnNews213');

    const approved = buildCaption({
      ...metadata,
      title: 'BẢN ĐÃ DUYỆT: ' + metadata.title,
      scriptSegments: metadata.script,
      planHook: metadata.hook,
      planEnding: metadata.ending,
    });
    await writeFile(join(videoDir, 'caption.txt'), approved);
    await expect(generateCaption(fixtureRoot, 'story')).resolves.toBe(outputPath);
    await expect(readFile(outputPath, 'utf8')).resolves.toBe(approved);

    await expect(generateCaption(fixtureRoot, 'story', {force: true})).resolves.toBe(outputPath);
    await expect(readFile(outputPath, 'utf8')).resolves.toBe(generated);
  });

  it('supports --all and skips directories without required workflow inputs', async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'caption-cli-all-'));
    await createVideoFixture(fixtureRoot, 'eligible-story');
    await mkdir(join(fixtureRoot, 'videos', 'incomplete-story'), {recursive: true});

    const result = await runNode([
      'scripts/generate-caption.mjs',
      '--root',
      fixtureRoot,
      '--all',
    ]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain(join(fixtureRoot, 'videos', 'eligible-story', 'caption.txt'));
    await expect(readFile(join(fixtureRoot, 'videos', 'eligible-story', 'caption.txt'), 'utf8')).resolves.toContain('#VnNews213');
  });

  it('returns rule errors and a non-zero status for an invalid caption', async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'caption-cli-invalid-'));
    const videoDir = await createVideoFixture(fixtureRoot);
    const captionPath = join(videoDir, 'caption.txt');
    await writeFile(captionPath, '🔴 Xin chào mọi người. Bạn có đồng ý không?');

    const result = await runNode([
      'scripts/validate-caption.mjs',
      captionPath,
      join(videoDir, 'spec.json'),
      join(videoDir, 'script', 'script.json'),
    ]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Caption phải có 100–180 từ.');
    expect(result.stderr).toContain('Caption phải có #VnNews213.');
  });
});
