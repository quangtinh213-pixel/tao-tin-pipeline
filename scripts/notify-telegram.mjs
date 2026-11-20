#!/usr/bin/env node

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const MAX_LENGTH = 4000;

export async function sendTelegram(text, {fetcher = fetch, env = process.env, log = console.log} = {}) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    log('⚠️ Chưa cấu hình Telegram (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID), bỏ qua thông báo.');
    return false;
  }

  const body = String(text).length > MAX_LENGTH ? `${String(text).slice(0, MAX_LENGTH)}…` : String(text);
  try {
    const response = await fetcher(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({chat_id: chatId, text: body, disable_web_page_preview: true}),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      log(`⚠️ Telegram trả lỗi HTTP ${response.status}.`);
      return false;
    }
    return true;
  } catch (error) {
    log(`⚠️ Gửi Telegram thất bại: ${String(error?.message || error).replaceAll(token, '***')}`);
    return false;
  }
}

export async function sendTelegramPhoto(photoPath, caption = '', {fetcher = fetch, env = process.env, log = console.log} = {}) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return false;
  }
  if (!photoPath || !fs.existsSync(photoPath)) {
    return sendTelegram(caption, {fetcher, env, log});
  }

  try {
    const fileBytes = fs.readFileSync(photoPath);
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', String(caption).slice(0, 1024));
    formData.append('photo', new Blob([fileBytes], {type: 'image/jpeg'}), path.basename(photoPath));

    const response = await fetcher(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      log(`⚠️ Telegram trả lỗi HTTP ${response.status} khi gửi ảnh.`);
      return sendTelegram(caption, {fetcher, env, log});
    }
    return true;
  } catch (error) {
    log(`⚠️ Gửi ảnh Telegram thất bại, fallback sang tin nhắn thường: ${String(error?.message || error).replaceAll(token, '***')}`);
    return sendTelegram(caption, {fetcher, env, log});
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await sendTelegram(process.argv.slice(2).join(' '));
}
