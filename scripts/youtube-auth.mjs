#!/usr/bin/env node

import 'dotenv/config';
import http from 'node:http';
import readline from 'node:readline';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {google} from 'googleapis';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// YOUTUBE_ENV_FILE: ghi refresh token của kênh khác vào file riêng, không đè token VNNews.
const ENV_PATH = process.env.YOUTUBE_ENV_FILE ? path.resolve(process.env.YOUTUBE_ENV_FILE) : path.join(ROOT, '.env');
const CALLBACK_PORT = 8910;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}`;

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  // Needed for videos.update (edit title/metadata of uploaded videos).
  'https://www.googleapis.com/auth/youtube.force-ssl',
  // Full channel management (playlists, comments, captions...).
  'https://www.googleapis.com/auth/youtube',
  // YouTube Analytics: watch time, retention, traffic sources, revenue.
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
];

function updateEnvKey(key, value) {
  const source = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const lines = source.length > 0 ? source.split(/\r?\n/) : [];
  const lineRegex = new RegExp(`^\\s*${key}\\s*=`);
  const nextLine = `${key}=${value}`;
  let updated = false;

  const nextLines = lines.map((line) => {
    if (!updated && lineRegex.test(line)) {
      updated = true;
      return nextLine;
    }
    return line;
  });

  if (!updated) {
    if (nextLines.length > 0 && nextLines.at(-1) !== '') {
      nextLines.push('');
    }
    nextLines.push(nextLine);
  }

  fs.writeFileSync(ENV_PATH, `${nextLines.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
}

async function main() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log(`
=============================================================================
  HƯỚNG DẪN THIẾT LẬP KẾT NỐI KÊNH YOUTUBE VNNEWS (CHỈ CẦN LÀM 1 LẦN)
=============================================================================

Bạn cần có Client ID và Client Secret từ Google Cloud Console để ủy quyền:

1. Truy cập Google Cloud Console:
   👉 https://console.cloud.google.com/

2. Tạo hoặc chọn một Project (ví dụ: "VNNews Video Studio").

3. Bật API YouTube:
   - Vào menu bên trái: "APIs & Services" > "Library".
   - Tìm kiếm: "YouTube Data API v3".
   - Nhấn "Enable" (Bật).
   - Làm tương tự với "YouTube Analytics API".

4. Thiết lập màn hình đồng ý OAuth (OAuth consent screen):
   - Vào "APIs & Services" > "OAuth consent screen".
   - Chọn loại: "External" (Bên ngoài).
   - Điền tên ứng dụng (vd: VNNews Video Studio) và email liên hệ.
   - Thêm Scopes: Chọn "../auth/youtube", "../auth/youtube.upload", "../auth/youtube.readonly", "../auth/youtube.force-ssl", "../auth/yt-analytics.readonly" và "../auth/yt-analytics-monetary.readonly".
   - Thêm Test Users: Thêm địa chỉ Gmail quản trị kênh YouTube VNNews.

5. Tạo Credentials (OAuth 2.0 Client ID):
   - Vào "APIs & Services" > "Credentials".
   - Nhấn "Create Credentials" > "OAuth client ID".
   - Application type: Chọn "Web application" (Ứng dụng web).
   - Trong mục "Authorized redirect URIs" (URI chuyển hướng được ủy quyền), THÊM:
     👉 ${REDIRECT_URI}
   - Nhấn "Create" để nhận Client ID và Client Secret.

6. Lưu vào file .env của dự án bằng lệnh:
   node scripts/update-config.mjs --key YOUTUBE_CLIENT_ID --value "<YOUR_CLIENT_ID>"
   node scripts/update-config.mjs --key YOUTUBE_CLIENT_SECRET --value "<YOUR_CLIENT_SECRET>"

7. Chạy lại lệnh này:
   npm run youtube:auth
=============================================================================
`);
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log(`\n🔑 KHỞI ĐỘNG XÁC THỰC OAUTH 2.0 VỚI YOUTUBE...`);
  console.log(`\nVui lòng mở đường link sau trong trình duyệt và đăng nhập tài khoản sở hữu kênh VNNews:\n`);
  console.log(`👉 ${authUrl}\n`);

  if (process.platform === 'darwin') {
    try {
      await execFileAsync('open', [authUrl]);
      console.log(`(Đã tự động mở trang xác thực trên trình duyệt của bạn)`);
    } catch {
      // Ignored if unable to open browser automatically
    }
  }

  // Set up local HTTP server to receive the authorization code
  let server;
  const finishAuth = async (code) => {
    try {
      console.log(`\n⏳ Đang trao đổi mã xác thực lấy Refresh Token...`);
      const {tokens} = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      if (!tokens.refresh_token) {
        console.warn('⚠️ Cảnh báo: Google không trả về refresh_token mới (do đã được cấp quyền trước đó).');
        console.warn('Nếu cần cấp mới hoàn toàn, vui lòng thu hồi quyền ứng dụng trên Google Account và chạy lại.');
      } else {
        updateEnvKey('YOUTUBE_REFRESH_TOKEN', tokens.refresh_token);
        console.log(`💾 Đã lưu YOUTUBE_REFRESH_TOKEN vào .env thành công!`);
      }

      // Check channel info
      const youtube = google.youtube({version: 'v3', auth: oauth2Client});
      const channelsRes = await youtube.channels.list({
        part: ['snippet'],
        mine: true,
      });

      const channel = channelsRes.data.items?.[0];
      if (channel) {
        console.log(`\n🎉 KẾT NỐI THÀNH CÔNG!`);
        console.log(`   📺 Tên kênh:    ${channel.snippet?.title}`);
        console.log(`   🆔 Channel ID:  ${channel.id}`);
        console.log(`   📝 Mô tả:       ${channel.snippet?.description?.slice(0, 80)}...`);
      } else {
        console.log(`\n✅ Đã xác thực thành công tài khoản Google!`);
      }

      console.log(`\nBây giờ bạn có thể upload video tự động lên kênh YouTube:`);
      console.log(`  - Upload thủ công:      npm run youtube:upload`);
      console.log(`  - Chạy chế độ tự động:  node scripts/update-config.mjs --key YOUTUBE_AUTO_UPLOAD --value true\n`);

      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (err) {
      console.error(`\n❌ Lỗi xác thực:`, err.message || err);
      process.exit(1);
    }
  };

  server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      const code = urlObj.searchParams.get('code');
      const error = urlObj.searchParams.get('error');

      if (error) {
        res.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(`<h1>Lỗi xác thực: ${error}</h1><p>Vui lòng thử lại.</p>`);
        console.error(`Lỗi từ Google OAuth: ${error}`);
        process.exit(1);
      }

      if (code) {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><title>Xác thực thành công</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #16a34a;">✅ Xác thực thành công!</h1>
            <p>Bạn đã kết nối thành công kênh YouTube VNNews với hệ thống tạo video AI.</p>
            <p>Bạn có thể đóng tab này và quay lại cửa sổ Terminal.</p>
          </body>
          </html>
        `);
        server.close();
        await finishAuth(code);
      }
    } catch (err) {
      console.error('Lỗi server callback:', err);
    }
  });

  server.listen(CALLBACK_PORT, () => {
    console.log(`Đang lắng nghe mã ủy quyền tại ${REDIRECT_URI}...`);
    console.log(`(Hoặc bạn có thể dán mã 'code' trực tiếp vào đây nếu không dùng trình duyệt tự động):`);
  });

  // Also listen on console input in case user is on remote or redirects fail
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('> ', async (manualCode) => {
    if (manualCode && manualCode.trim()) {
      if (server) server.close();
      await finishAuth(manualCode.trim());
    }
  });
}

main().catch((err) => {
  console.error('Lỗi:', err);
  process.exit(1);
});
