import {afterEach, describe, expect, it} from 'vitest';
import {createDashboardServer} from './dashboard.mjs';

let server;

afterEach(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  server = undefined;
});

async function startServer() {
  server = createDashboardServer({rootDir: process.cwd()});
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

describe('dashboard static assets', () => {
  it('serves the page shell, styles, and app script with the expected UI contract', async () => {
    const baseUrl = await startServer();

    const htmlResponse = await fetch(`${baseUrl}/`);
    expect(htmlResponse.status).toBe(200);
    expect(htmlResponse.headers.get('content-type')).toContain('text/html');
    const html = await htmlResponse.text();
    expect(html).toContain('dashboard-search');
    expect(html).toContain('refresh-button');
    expect(html).toContain('production-form');
    expect(html).toContain('production-template');
    expect(html).not.toMatch(/<video\b/i);
    expect(html).not.toMatch(/\bdownload\b/i);
    expect(html).not.toContain('#VnNews213');

    const stylesResponse = await fetch(`${baseUrl}/styles.css`);
    expect(stylesResponse.status).toBe(200);
    expect(stylesResponse.headers.get('content-type')).toContain('text/css');

    const appResponse = await fetch(`${baseUrl}/app.js`);
    expect(appResponse.status).toBe(200);
    expect(appResponse.headers.get('content-type')).toContain('text/javascript');
    const app = await appResponse.text();
    expect(app).toContain('/api/videos');
    expect(app).toContain('/script');
    expect(app).toContain('/caption');
    expect(app).toContain('/reveal');
    expect(app).toContain('/api/jobs');
    expect(app).toContain('/api/production-config');
    expect(app).toContain('navigator.clipboard.writeText');
    expect(app).toContain('Sao chép caption');
    expect(app).toContain('captionAvailable');

    const styles = await stylesResponse.text();
    expect(styles).toMatch(/\.card-actions[\s\S]*flex-wrap/);
  });
});
