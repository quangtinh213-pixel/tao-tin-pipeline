import os from 'node:os';
import { Config } from '@remotion/cli/config';

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
