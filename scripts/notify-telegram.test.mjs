import {describe, expect, it, vi} from 'vitest';
import {sendTelegram} from './notify-telegram.mjs';

const env = {TELEGRAM_BOT_TOKEN: 'T', TELEGRAM_CHAT_ID: '42'};

describe('notify-telegram', () => {
  it('skips fetch when token or chat id is missing', async () => {
    const fetcher = vi.fn();
    expect(await sendTelegram('x', {fetcher, env: {}, log: () => {}})).toBe(false);
    expect(await sendTelegram('x', {fetcher, env: {TELEGRAM_BOT_TOKEN: 'T'}, log: () => {}})).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('posts to the bot endpoint with chat id', async () => {
    const fetcher = vi.fn().mockResolvedValue({ok: true});
    expect(await sendTelegram('xin chào', {fetcher, env, log: () => {}})).toBe(true);
    expect(fetcher.mock.calls[0][0]).toBe('https://api.telegram.org/botT/sendMessage');
    expect(fetcher.mock.calls[0][1].method).toBe('POST');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({chat_id: '42', text: 'xin chào', disable_web_page_preview: true});
  });

  it('returns false on a non-ok response', async () => {
    const fetcher = vi.fn().mockResolvedValue({ok: false, status: 401});
    expect(await sendTelegram('x', {fetcher, env, log: () => {}})).toBe(false);
  });

  it('never throws and never logs the token', async () => {
    const logs = [];
    const fetcher = vi.fn().mockRejectedValue(new Error('network down'));
    const secretEnv = {TELEGRAM_BOT_TOKEN: 'SECRET', TELEGRAM_CHAT_ID: '1'};
    expect(await sendTelegram('x', {fetcher, env: secretEnv, log: (m) => logs.push(m)})).toBe(false);
    expect(logs.join('\n')).toContain('network down');
    expect(logs.join('\n')).not.toContain('SECRET');
  });

  it('truncates text over 4000 chars', async () => {
    const fetcher = vi.fn().mockResolvedValue({ok: true});
    await sendTelegram('a'.repeat(5000), {fetcher, env, log: () => {}});
    const {text} = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(text.length).toBe(4001);
    expect(text.endsWith('…')).toBe(true);
  });
});
