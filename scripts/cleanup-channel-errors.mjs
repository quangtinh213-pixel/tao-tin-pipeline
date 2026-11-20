#!/usr/bin/env node

import 'dotenv/config';
import {getAuthenticatedYouTubeClient} from './youtube-upload.mjs';

const TARGET_IDS = ['lP4wQjjgLUI', '_brqvHH36ms', 'AEhSdL2yYK0'];

async function main() {
  const execute = process.argv.includes('--execute');
  const yt = getAuthenticatedYouTubeClient();
  const res = await yt.videos.list({
    part: ['snippet', 'statistics', 'contentDetails', 'status'],
    id: TARGET_IDS,
  });
  const items = res.data?.items || [];
  if (!items.length) {
    console.log('Không còn video nào trong danh sách cần dọn trên kênh.');
    return;
  }

  for (const v of items) {
    console.log(
      `${execute ? '🗑️ XÓA' : '🔍 [DRY-RUN]'} ${v.id} | ${v.contentDetails?.duration} | ${v.statistics?.viewCount ?? 0} view | ${v.snippet?.title}`,
    );
    if (execute) {
      await yt.videos.delete({id: v.id});
      console.log(`   ✅ Đã xóa vĩnh viễn ${v.id}`);
    }
  }
  if (!execute) {
    console.log('\nChạy lại với --execute để xóa vĩnh viễn các video trên.');
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
