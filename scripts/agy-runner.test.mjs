import {EventEmitter} from 'node:events';
import {describe, expect, it, vi} from 'vitest';
import {
  checkAgyPreflight,
  rankArticlesWithAgy,
  resolveAgyCommand,
  runAgyPrompt,
  runAgyTaoTin,
  runAgyTaoVideoDai,
} from './agy-runner.mjs';

function makeMockSpawn({exitCode = 0, stdout = '', stderr = '', error = null} = {}) {
  return vi.fn(() => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = vi.fn();
    queueMicrotask(() => {
      if (error) {
        child.emit('error', error);
        return;
      }
      if (stdout) child.stdout.emit('data', Buffer.from(stdout, 'utf8'));
      if (stderr) child.stderr.emit('data', Buffer.from(stderr, 'utf8'));
      child.emit('close', exitCode);
    });
    return child;
  });
}

describe('agy-runner', () => {
  it('resolveAgyCommand prefers AGY_BIN, then Windows LOCALAPPDATA agy.exe', () => {
    expect(resolveAgyCommand({env: {AGY_BIN: 'C:\\custom\\agy.exe'}})).toBe('C:\\custom\\agy.exe');
    expect(
      resolveAgyCommand({
        env: {LOCALAPPDATA: 'C:\\Users\\78\\AppData\\Local'},
        platform: 'win32',
        exists: (p) => p.endsWith('agy.exe'),
      }),
    ).toContain('agy.exe');
    expect(resolveAgyCommand({env: {}, platform: 'linux', exists: () => false})).toBe('agy');
  });

  it('checkAgyPreflight returns true on exit 0 and false on failure', async () => {
    const okSpawn = makeMockSpawn({exitCode: 0, stdout: '1.5.9\n'});
    await expect(checkAgyPreflight({agyBin: 'agy', spawnFn: okSpawn, onLog: () => {}})).resolves.toBe(true);
    expect(okSpawn).toHaveBeenCalledWith('agy', ['--version'], expect.objectContaining({shell: false}));

    const failSpawn = makeMockSpawn({error: new Error('ENOENT')});
    await expect(checkAgyPreflight({agyBin: 'agy', spawnFn: failSpawn, onLog: () => {}})).resolves.toBe(false);
  });

  it('runAgyPrompt passes print, skip-permissions, mode, and rejects on non-zero exit', async () => {
    const spawnFn = makeMockSpawn({exitCode: 0, stdout: 'done\n'});
    const res = await runAgyPrompt('hello', {agyBin: 'agy', cwd: '/repo', model: 'm1', spawnFn});
    expect(res.stdout).toBe('done\n');
    expect(spawnFn).toHaveBeenCalledWith(
      'agy',
      ['-p', 'hello', '--output-format', 'text', '--dangerously-skip-permissions', '--mode', 'auto', '--model', 'm1'],
      expect.objectContaining({cwd: '/repo', shell: false}),
    );

    const errSpawn = makeMockSpawn({exitCode: 1, stderr: 'boom'});
    await expect(runAgyPrompt('hello', {agyBin: 'agy', spawnFn: errSpawn})).rejects.toThrow('mã 1: boom');
  });

  it('rankArticlesWithAgy parses JSON picks using agy without calling external LLM APIs', async () => {
    const candidates = [
      {title: 'Tin 1', link: 'https://a.vn/1', pubDate: new Date().toUTCString(), description: 'd1', thumbnail: 'img', source: 'A', sourceId: 'a'},
      {title: 'Tin 2', link: 'https://b.vn/2', pubDate: new Date().toUTCString(), description: 'd2', thumbnail: null, source: 'B', sourceId: 'b'},
    ];
    const runner = vi.fn().mockResolvedValue({stdout: '```json\n{"picks":[{"index":0,"reason":"tin nóng"}]}\n```'});
    const picks = await rankArticlesWithAgy(candidates, {count: 1, runner});
    expect(picks).toHaveLength(1);
    expect(picks[0].link).toBe('https://a.vn/1');
    expect(picks[0].reason).toBe('tin nóng');
    expect(runner.mock.calls[0][1].disableSlashCommands).toBe(true);
  });

  it('runAgyTaoTin and runAgyTaoVideoDai invoke agy with the corresponding skill docs', async () => {
    const runner = vi.fn().mockResolvedValue({stdout: 'ok', stderr: '', exitCode: 0});
    await runAgyTaoTin({count: 3, until: '09:30', rootDir: '/repo', runner, onLog: () => {}});
    expect(runner.mock.calls[0][0]).toContain('docs/SKILL-TAO-TIN.md');
    expect(runner.mock.calls[0][0]).toContain('free-slots --until 09:30');
    expect(runner.mock.calls[0][1].skipPermissions).toBe(true);

    await runAgyTaoVideoDai({count: 1, rootDir: '/repo', runner, onLog: () => {}});
    expect(runner.mock.calls[1][0]).toContain('docs/SKILL-TAO-VIDEO-DAI.md');
    expect(runner.mock.calls[1][0]).toContain('long-news-filter.mjs --count 1');
  });
});
