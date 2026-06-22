/**
 * vite-plugin-upload.ts
 * Dev-only Vite plugin that exposes two endpoints so the admin UI can
 * upload and delete media files directly inside /public without leaving
 * the browser.
 *
 *  POST   /api/local-upload?type=photo|video|music&filename=foo.jpg
 *         Body: raw file bytes (Content-Type irrelevant)
 *         → saves to public/{photos|videos|music}/foo.jpg and updates manifest.json
 *
 *  DELETE /api/local-upload?type=photo|video|music&filename=foo.jpg
 *         → removes the file and updates manifest.json
 *
 * Only active during `vite dev` — has zero effect on production builds.
 */

import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

type MediaType = 'photo' | 'video' | 'music';

const TYPE_DIRS: Record<MediaType, string> = {
  photo: 'photos',
  video: 'videos',
  music: 'music',
};

// Filename sanitisation: allow alphanumeric, dot, dash, underscore, space
function sanitise(raw: string): string {
  return path.basename(raw).replace(/[^\w.\- ]/g, '_');
}

function readManifest(dir: string): string[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf-8'));
  } catch {
    return [];
  }
}

function writeManifest(dir: string, list: string[]): void {
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(list, null, 2) + '\n');
}

function addToManifest(dir: string, filename: string): void {
  const list = readManifest(dir);
  if (!list.includes(filename)) {
    list.push(filename);
    writeManifest(dir, list);
  }
}

function removeFromManifest(dir: string, filename: string): void {
  const list = readManifest(dir).filter((f) => f !== filename);
  writeManifest(dir, list);
}

function jsonResponse(res: ServerResponse, status: number, body: object): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(body));
}

export function localUploadPlugin(): Plugin {
  return {
    name: 'local-upload',
    configureServer(server) {
      // Use server.config.root so the path is always correct regardless of CWD
      const projectRoot = server.config.root;
      const publicDir   = path.join(projectRoot, 'public');

      // ── POST /api/save-config : write config JSON to public/config.json ──
      server.middlewares.use('/api/save-config', (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
        if (req.method !== 'POST') {
          return jsonResponse(res, 405, { error: 'Method not allowed' });
        }

        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('error', (err) => jsonResponse(res, 500, { error: err.message }));
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf-8');
            JSON.parse(body); // validate — throws if malformed
            const configPath = path.join(publicDir, 'config.json');
            fs.writeFileSync(configPath, body + '\n', 'utf-8');
            console.log('[save-config] wrote → public/config.json');
            jsonResponse(res, 200, { success: true });
          } catch (err: any) {
            console.error('[save-config] error:', err);
            jsonResponse(res, 500, { error: err.message });
          }
        });
      });

      server.middlewares.use('/api/local-upload', (req: IncomingMessage, res: ServerResponse) => {
        // Always allow cross-origin (admin panel may run on a different port)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // CORS pre-flight
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const urlObj = new URL(req.url ?? '/', `http://localhost`);
        const type     = urlObj.searchParams.get('type') as MediaType | null;
        const rawName  = urlObj.searchParams.get('filename') ?? '';
        const filename = sanitise(rawName);

        if (!type || !TYPE_DIRS[type] || !filename) {
          return jsonResponse(res, 400, { error: 'Missing or invalid ?type / ?filename param' });
        }

        const targetDir  = path.join(publicDir, TYPE_DIRS[type]);
        const targetPath = path.join(targetDir, filename);

        // ── POST: save file ──────────────────────────────────────────────
        if (req.method === 'POST') {
          fs.mkdirSync(targetDir, { recursive: true });

          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(c));
          req.on('error', (err) => {
            console.error('[local-upload] read error:', err);
            jsonResponse(res, 500, { error: err.message });
          });
          req.on('end', () => {
            try {
              fs.writeFileSync(targetPath, Buffer.concat(chunks));
              addToManifest(targetDir, filename);
              console.log(`[local-upload] saved → ${targetPath}`);
              jsonResponse(res, 200, { success: true, filename, path: targetPath });
            } catch (err: any) {
              console.error('[local-upload] write error:', err);
              jsonResponse(res, 500, { error: err.message });
            }
          });
          return;
        }

        // ── DELETE: remove file ──────────────────────────────────────────
        if (req.method === 'DELETE') {
          try {
            if (fs.existsSync(targetPath)) {
              fs.unlinkSync(targetPath);
              console.log(`[local-upload] deleted → ${targetPath}`);
            }
            removeFromManifest(targetDir, filename);
            jsonResponse(res, 200, { success: true });
          } catch (err: any) {
            console.error('[local-upload] delete error:', err);
            jsonResponse(res, 500, { error: err.message });
          }
          return;
        }

        jsonResponse(res, 405, { error: 'Method not allowed' });
      });
    },
  };
}
