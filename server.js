const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache'
  });
  res.end(body);
}

function toPublicPath(urlPath) {
  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^\.+/, '');
  return path.join(ROOT, safePath);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const urlPath = url.pathname;

  if (urlPath === '/health') {
    return send(res, 200, JSON.stringify({ status: 'ok' }), 'application/json; charset=utf-8');
  }

  if (urlPath === '/runtime-config.js') {
    const config = {
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
    };

    const body = `window.__VIZFORM_RUNTIME_CONFIG__ = ${JSON.stringify(config)};`;
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return res.end(body);
  }

  let filePath = toPublicPath(urlPath === '/' ? '/index.html' : urlPath);

  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, 'Forbidden');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, 'Not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`VizForm server listening on http://0.0.0.0:${PORT}`);
});
