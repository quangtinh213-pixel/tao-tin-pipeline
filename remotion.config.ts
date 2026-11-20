import os from 'node:os';
import fs from 'node:fs';
import { Config } from '@remotion/cli/config';

// 0. Tận dụng trình duyệt sẵn có trên hệ thống để render tức thì (bỏ qua download headless shell)
const browserCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
];
const foundBrowser = browserCandidates.find((p) => fs.existsSync(p));
if (foundBrowser) {
  Config.setBrowserExecutable(foundBrowser);
}

// 1. Bộ tăng tốc phần cứng macOS (Apple VideoToolbox: h264_videotoolbox)
Config.setHardwareAcceleration('if-possible');

// 2. Preset nén video nhanh (tiết kiệm thời gian encode khi fallback CPU)
Config.setX264Preset('faster');

// 3. Concurrency: 8 trên máy i9-9880H, tự giảm theo số nhân trên máy ít nhân hơn (VPS 6 nhân)
Config.setConcurrency(Math.min(8, os.cpus().length));

// 4. Định dạng frame JPEG chất lượng 80% (tối ưu kích thước snapshot và IPC transfer)
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(80);

// 5. Kích hoạt Webpack bundle caching
Config.setCachingEnabled(true);

// 7. Cấp phát bộ nhớ đệm giải mã video ngoài luồng
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);
