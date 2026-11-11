#!/usr/bin/env node

/**
 * scripts/generate-product-image.mjs
 *
 * Generate or edit tailored scenario/humor/drama images for product video scripts
 * using OpenAI's latest ChatGPT Images 2.5 (released Sept 2026).
 *
 * Usage:
 *   node scripts/generate-product-image.mjs "<slug>" "<prompt>" [filename] [sourceImagePath]
 *
 * Examples:
 *   # Text-to-Image with ChatGPT Images 2.5:
 *   node scripts/generate-product-image.mjs "my-slug" "A humorous scene of someone shocked at cheap tangled headphones, vertical 9:16"
 *
 *   # Image-to-Image / Image Editing based on an original product photo:
 *   node scripts/generate-product-image.mjs "my-slug" "Place this product on an elegant wooden bedside table with warm morning sunlight, vertical 9:16" "scenario-01.png" "public/my-slug/evidence/image-01.jpg"
 *
 * Output:
 *   public/<slug>/evidence/<filename>.png
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load environment variables
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadEnv();

const [slug, prompt, customFilename, sourceImagePath] = process.argv.slice(2);

if (!slug || !prompt) {
  console.error('Usage: node scripts/generate-product-image.mjs "<slug>" "<prompt>" [filename] [sourceImagePath]');
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is not set in environment or .env');
  process.exit(1);
}

// Next-gen model: ChatGPT Images 2.5 (gpt-image-2.5, replaces legacy DALL-E)
const PRIMARY_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5';
const FALLBACK_MODELS = ['gpt-image-2.5', 'chatgpt-images-2.5', 'dall-e-3'];

async function main() {
  const {default: OpenAI} = await import('openai');
  const openai = new OpenAI({apiKey});

  console.log(`[generate-product-image] Provider: OpenAI (${PRIMARY_IMAGE_MODEL})`);
  console.log(`[generate-product-image] Generating AI image for slug: ${slug}...`);
  console.log(`[generate-product-image] Prompt: "${prompt.slice(0, 100)}..."`);
  if (sourceImagePath) {
    console.log(`[generate-product-image] Source image provided: ${sourceImagePath}`);
  }

  const evidenceDir = path.join(ROOT, 'public', slug, 'evidence');
  fs.mkdirSync(evidenceDir, {recursive: true});

  let savedBuffer = null;
  const modelsToTry = [PRIMARY_IMAGE_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_IMAGE_MODEL)];

  for (const model of modelsToTry) {
    try {
      let item = null;
      if (sourceImagePath && fs.existsSync(sourceImagePath)) {
        // Image-to-Image / Editing: Edit or transform based on existing product image
        console.log(`[generate-product-image] Attempting Image Editing with model: ${model}...`);
        const {toFile} = await import('openai');
        const imgBuffer = fs.readFileSync(sourceImagePath);
        const mimeType = sourceImagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const fileObj = await toFile(imgBuffer, path.basename(sourceImagePath), {type: mimeType});
        const editResponse = await openai.images.edit({
          model,
          image: fileObj,
          prompt: `${prompt}. Keep the exact physical product appearance 100% identical to the reference photo, high aesthetic commercial lighting, vertical composition.`,
          n: 1,
          size: '1024x1536',
        });
        item = editResponse.data?.[0];
      } else {
        // Text-to-Image Generation
        console.log(`[generate-product-image] Generating with model: ${model}...`);
        const response = await openai.images.generate({
          model,
          prompt: `${prompt}. Ultra-realistic commercial photography, vertical composition, aesthetic soft lighting, high-end product presentation, no distorted artifacts.`,
          n: 1,
          size: '1024x1536',
        });
        item = response.data?.[0];
      }

      if (item?.b64_json) {
        savedBuffer = Buffer.from(item.b64_json, 'base64');
        console.log(`[generate-product-image] Successfully received base64 image with model: ${model}`);
        break;
      } else if (item?.url) {
        const res = await fetch(item.url);
        if (res.ok) {
          savedBuffer = Buffer.from(await res.arrayBuffer());
          console.log(`[generate-product-image] Successfully downloaded image URL with model: ${model}`);
          break;
        }
      }
    } catch (err) {
      console.warn(`[generate-product-image] Model "${model}" attempt note: ${err.message}`);
    }
  }

  if (!savedBuffer) {
    throw new Error('OpenAI Images API returned no valid image across tested models.');
  }

  let filename = customFilename || `ai-gen-${Date.now().toString(36)}.png`;
  if (!filename.endsWith('.png') && !filename.endsWith('.jpg')) {
    filename += '.png';
  }

  const destPath = path.join(evidenceDir, filename);
  fs.writeFileSync(destPath, savedBuffer);

  console.log(`[generate-product-image] ✅ Successfully saved to: ${destPath} (${(savedBuffer.length / 1024).toFixed(1)} KB)`);
  console.log(`Relative path: ${slug}/evidence/${filename}`);
}

main().catch((err) => {
  console.error(`[generate-product-image] Error: ${err.message}`);
  process.exit(1);
});
