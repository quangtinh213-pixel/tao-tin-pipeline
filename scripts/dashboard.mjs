import 'dotenv/config';
import {execFile} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {join, resolve} from 'node:path';
import {
  getVideoRecord,
  readCaptionText,
  readScriptText,
  scanVideoRecords,
} from './dashboard-data.mjs';
import {
  createProductionManager,
  readJsonBody,
  scanTemplateOptions,
} from './dashboard-production.mjs';
import {uploadVideo} from './youtube-upload.mjs';

const execFileAsync = promisify(execFile);
const DEFAULT_PORT = 4321;
const STATIC_ASSETS = new Map([
  ['/', {fileName: 'index.html', contentType: 'text/html; charset=utf-8'}],
  ['/styles.css', {fileName: 'styles.css', contentType: 'text/css; charset=utf-8'}],
  ['/app.js', {fileName: 'app.js', contentType: 'text/javascript; charset=utf-8'}],
]);

function sendJson(response, status, payload) {
  response.writeHead(status, {'content-type': 'application/json; charset=utf-8'});
  response.end(JSON.stringify(payload));
}

function createDashboardError(message, code, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export async function revealInFinder(videoPath) {
  if (process.platform !== 'darwin') {
    throw createDashboardError(
      'Finder reveal is only supported on macOS.',
      'DASHBOARD_UNSUPPORTED_PLATFORM',
      501,
    );
  }

  await execFileAsync('open', ['-R', videoPath]);
}

function parseSegments(pathname) {
  try {
    return pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
  } catch {
    throw createDashboardError('Malformed URL path.', 'DASHBOARD_BAD_URL', 400);
  }
}

function errorStatus(error) {
  if (Number.isInteger(error?.status)) return error.status;
  if (error?.code === 'DASHBOARD_INVALID_SLUG') return 400;
  return 500;
}

async function serveStaticAsset(response, dashboardDir, pathname, method = 'GET') {
  const asset = STATIC_ASSETS.get(pathname);
  if (!asset) return false;

  try {
    const content = await readFile(join(dashboardDir, asset.fileName));
    response.writeHead(200, {
      'content-type': asset.contentType,
      'cache-control': 'no-cache, no-store, must-revalidate',
      'pragma': 'no-cache',
      'expires': '0',
    });
    if (method === 'HEAD') response.end();
    else response.end(content);
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
  return true;
}

async function handleRequest({request, response, rootDir, videosDir, dashboardDir, finder, production}) {
  const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
  const segments = parseSegments(requestUrl.pathname);

  if (segments[0] === 'api') {
    if (request.method === 'GET' && segments.length === 2 && segments[1] === 'production-config') {
      sendJson(response, 200, {
        api: production.apiStatus(),
        templates: await scanTemplateOptions(rootDir),
        stages: production.stages.map(([id, label]) => ({id, label})),
      });
      return;
    }

    if (request.method === 'GET' && segments.length === 2 && segments[1] === 'jobs') {
      sendJson(response, 200, {jobs: production.listJobs()});
      return;
    }

    if (request.method === 'POST' && segments.length === 2 && segments[1] === 'jobs') {
      const body = await readJsonBody(request);
      if (Array.isArray(body?.items) || Array.isArray(body?.batch) || Array.isArray(body?.contexts)) {
        const jobs = await production.createJobs(body);
        sendJson(response, 202, {jobs});
      } else {
        const job = await production.createJob(body);
        sendJson(response, 202, {job});
      }
      return;
    }

    if (segments.length >= 3 && segments[1] === 'jobs') {
      const job = production.getJob(segments[2]);
      if (!job) {
        sendJson(response, 404, {error: 'Production job not found.'});
        return;
      }
      if (request.method === 'GET' && segments.length === 3) {
        sendJson(response, 200, {job});
        return;
      }
      if (request.method === 'POST' && segments.length === 4 && segments[3] === 'cancel') {
        production.cancelJob(segments[2]);
        sendJson(response, 200, {job: production.getJob(segments[2])});
        return;
      }
      if (request.method === 'POST' && segments.length === 4 && segments[3] === 'retry') {
        const retried = await production.retryJob(segments[2]);
        sendJson(response, 202, {job: retried});
        return;
      }
    }

    if (request.method === 'GET' && segments.length === 2 && segments[1] === 'videos') {
      sendJson(response, 200, {videos: await scanVideoRecords(videosDir)});
      return;
    }

    if (
      request.method === 'GET' &&
      segments.length === 4 &&
      segments[1] === 'videos' &&
      segments[3] === 'script'
    ) {
      const slug = segments[2];
      const record = await getVideoRecord(videosDir, slug);
      if (!record) {
        sendJson(response, 404, {error: 'Video not found.'});
        return;
      }

      const script = await readScriptText(videosDir, slug);
      if (!script) {
        sendJson(response, 422, {error: 'Script is unavailable for this video.'});
        return;
      }

      sendJson(response, 200, {slug, script});
      return;
    }

    if (
      request.method === 'GET' &&
      segments.length === 4 &&
      segments[1] === 'videos' &&
      segments[3] === 'caption'
    ) {
      const slug = segments[2];
      const record = await getVideoRecord(videosDir, slug);
      if (!record) {
        sendJson(response, 404, {error: 'Video not found.'});
        return;
      }

      const caption = await readCaptionText(videosDir, slug);
      if (!caption) {
        sendJson(response, 422, {error: 'Caption is unavailable for this video.'});
        return;
      }

      sendJson(response, 200, {slug, caption});
      return;
    }

    if (
      request.method === 'POST' &&
      segments.length === 4 &&
      segments[1] === 'videos' &&
      segments[3] === 'reveal'
    ) {
      const slug = segments[2];
      const record = await getVideoRecord(videosDir, slug);
      if (!record) {
        sendJson(response, 404, {error: 'Video not found.'});
        return;
      }

      await finder(record.videoPath);
      sendJson(response, 200, {ok: true});
      return;
    }

    if (
      request.method === 'POST' &&
      segments.length === 4 &&
      segments[1] === 'videos' &&
      segments[3] === 'youtube-upload'
    ) {
      const slug = segments[2];
      const record = await getVideoRecord(videosDir, slug);
      if (!record) {
        sendJson(response, 404, {error: 'Video not found.'});
        return;
      }

      try {
        const uploadResult = await uploadVideo(slug, {videosDir});
        sendJson(response, 200, {ok: true, upload: uploadResult});
      } catch (err) {
        sendJson(response, 500, {error: err.message || 'Lỗi khi upload lên YouTube'});
      }
      return;
    }

    sendJson(response, 404, {error: 'Not found.'});
    return;
  }

  if (['GET', 'HEAD'].includes(request.method) && await serveStaticAsset(response, dashboardDir, requestUrl.pathname, request.method)) {
    return;
  }

  sendJson(response, 404, {error: 'Not found.'});
}

export function createDashboardServer({rootDir, finder = revealInFinder, logger = console, productionManager} = {}) {
  const projectRoot = resolve(rootDir ?? process.cwd());
  const videosDir = join(projectRoot, 'videos');
  const dashboardDir = join(projectRoot, 'dashboard');
  const production = productionManager ?? createProductionManager({rootDir: projectRoot});

  return createServer((request, response) => {
    handleRequest({request, response, rootDir: projectRoot, videosDir, dashboardDir, finder, production}).catch((error) => {
      if (errorStatus(error) >= 500) logger.error?.(error);
      if (!response.headersSent) {
        sendJson(response, errorStatus(error), {error: error.message || 'Dashboard request failed.'});
      } else {
        response.destroy(error);
      }
    });
  });
}

function parsePort(argv = process.argv, env = process.env) {
  const portFlagIndex = argv.indexOf('--port');
  const rawPort = portFlagIndex >= 0 ? argv[portFlagIndex + 1] : env.DASHBOARD_PORT;
  if (rawPort === undefined || rawPort === '') return DEFAULT_PORT;

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid dashboard port: ${rawPort}`);
  }
  return port;
}

export async function startDashboardServer({rootDir, port = parsePort()} = {}) {
  const server = createDashboardServer({rootDir});
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolvePromise);
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  console.log(`Dashboard ready: http://127.0.0.1:${actualPort}`);
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  startDashboardServer({port: parsePort()}).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
