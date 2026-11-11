import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {uploadReel, resolvePageToken, hideToken, formatFacebookDescription} from './facebook-reel-upload.mjs';
import {GENERIC_CAPTION_NOTES, GENERIC_CAPTION_CTAS} from './caption-rules.mjs';

const ENV = {FB_PAGE_TOKEN: 'USER-TOKEN', FB_PAGE_ID: '123', FB_GRAPH_API: 'v26.0'};

function fakeGraph(calls, {meId = 'user-1'} = {}) {
  return async (method, url, params = {}, headers = {}, body) => {
    calls.push({method, url, params, headers, body});
    if (url.endsWith('/me')) return {id: meId};
    if (url.endsWith('/me/accounts')) return {data: [{id: '123', access_token: 'PAGE-TOKEN'}]};
    if (params.upload_phase === 'start') return {video_id: 'VID-1'};
    return {success: true};
  };
}

describe('Facebook Reel upload', () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-reel-'));
    fs.mkdirSync(path.join(dir, 'slug-a', 'output'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'slug-a', 'output', 'video.mp4'), 'mp4data');
    fs.writeFileSync(path.join(dir, 'slug-a', 'caption.txt'), 'Tin nóng #VnNews213\n');
  });
  afterEach(() => fs.rmSync(dir, {recursive: true, force: true}));

  it('uploads in 3 phases with page token, records facebook.json, then skips on rerun', async () => {
    const calls = [];
    const record = await uploadReel('slug-a', {videosDir: dir, env: ENV, publishNow: true, log: () => {}, request: fakeGraph(calls)});

    expect(record.videoId).toBe('VID-1');
    const [start, rupload, finish] = calls.slice(2);
    expect(start.params).toMatchObject({upload_phase: 'start', access_token: 'PAGE-TOKEN'});
    expect(rupload.url).toBe('https://rupload.facebook.com/video-upload/v26.0/VID-1');
    expect(rupload.headers).toMatchObject({Authorization: 'OAuth PAGE-TOKEN', offset: '0', file_size: '7'});
    expect(finish.params).toMatchObject({upload_phase: 'finish', video_state: 'PUBLISHED', description: 'Tin nóng #VnNews213'});
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'slug-a', 'facebook.json'), 'utf8')).videoId).toBe('VID-1');

    const again = [];
    await uploadReel('slug-a', {videosDir: dir, env: ENV, log: () => {}, request: fakeGraph(again)});
    expect(again).toHaveLength(0);
  });

  it('schedules into golden-hour slots at least 2 hours apart', async () => {
    fs.mkdirSync(path.join(dir, 'slug-b', 'output'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'slug-b', 'output', 'video.mp4'), 'mp4data');
    const now = new Date('2026-11-05T03:00:00Z'); // 10:00 giờ VN
    const calls = [];
    const a = await uploadReel('slug-a', {videosDir: dir, env: ENV, now, log: () => {}, request: fakeGraph(calls)});
    const b = await uploadReel('slug-b', {videosDir: dir, env: ENV, now, log: () => {}, request: fakeGraph(calls)});

    expect(a.publishAt).toBe('2026-11-05T04:30:00.000Z'); // 11:30
    expect(b.publishAt).toBe('2026-11-05T11:00:00.000Z'); // 18:00
    const finish = calls.find((c) => c.params.upload_phase === 'finish');
    expect(finish.params).toMatchObject({video_state: 'SCHEDULED', scheduled_publish_time: String(Date.parse(a.publishAt) / 1000)});
  });

  it('skips stale renders unless forced', async () => {
    const later = new Date(Date.now() + 25 * 3_600_000);
    const calls = [];
    expect(await uploadReel('slug-a', {videosDir: dir, env: ENV, now: later, log: () => {}, request: fakeGraph(calls)})).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('shortens the YouTube caption for Facebook', () => {
    const caption = [
      '📌 ĐÁNG CHÚ Ý: Tiêu đề?', 'Chi tiết.', 'Theo bạn, mức phạt đủ chưa?', GENERIC_CAPTION_NOTES[1], GENERIC_CAPTION_CTAS[1],
      '#VnNews213 #thoisu #capnhat #tintuc24h #thongtin #chinhsach #tintucmoi #thongtinmoi #capnhat24h',
    ].join('\n\n');
    expect(formatFacebookDescription(caption)).toBe(
      '📌 ĐÁNG CHÚ Ý: Tiêu đề?\n\nChi tiết.\n\nTheo bạn, mức phạt đủ chưa?\n\n#VnNews213 #chinhsach #tintucmoi #thongtinmoi');
    expect(formatFacebookDescription(`Tin.\n\n${GENERIC_CAPTION_CTAS[0]}\n\n#VnNews213`)).toBe(`Tin.\n\n${GENERIC_CAPTION_CTAS[0]}\n\n#VnNews213`);
  });

  it('keeps a token that already belongs to the page', async () => {
    const calls = [];
    expect(await resolvePageToken('PAGE', '123', 'v26.0', fakeGraph(calls, {meId: '123'}))).toBe('PAGE');
    expect(calls).toHaveLength(1);
  });

  it('fails without config and never leaks the token in errors', async () => {
    await expect(uploadReel('slug-a', {videosDir: dir, env: {}, log: () => {}})).rejects.toThrow('FB_PAGE_TOKEN');
    const boom = async () => {
      throw new Error('bad token USER-TOKEN');
    };
    await expect(uploadReel('slug-a', {videosDir: dir, env: ENV, log: () => {}, request: boom})).rejects.toThrow('bad token ***');
    expect(hideToken('a USER-TOKEN b', 'USER-TOKEN')).toBe('a *** b');
  });
});
