import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export function openDatabase(name) {
  const folder = process.env.DATA_DIR || path.join(root, 'data');
  mkdirSync(folder, { recursive: true });
  const db = new DatabaseSync(path.join(folder, `${name}.sqlite`));
  db.exec(readFileSync(path.join(root, 'sql', `${name}.sql`), 'utf8'));
  return db;
}
export function createApp(name, { landing = true } = {}) {
  const app = express();
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    if (['POST', 'PUT'].includes(req.method) && !req.is('application/json')) return res.status(415).json({ error: 'Dữ liệu ghi phải dùng application/json.' });
    next();
  });
  app.use(express.json({ limit: '64kb' }));
  app.get('/health', (req, res) => res.json({ service: name, status: 'up' }));
  if (landing) app.get('/', (req, res) => res.json({ message: `Hello World từ dịch vụ ${name}` }));
  return app;
}
export function required(body, fields) {
  if (!body || fields.some(field => typeof body[field] !== 'string' || !body[field].trim())) {
    throw Object.assign(new Error(`Cần điền: ${fields.join(', ')}.`), { status: 400 });
  }
}
export function run(app, port, db) {
  app.use((req, res) => res.status(404).json({ error: 'Đường dẫn không tồn tại.' }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Mã hoặc cặp đăng ký đã tồn tại.' });
    const status = err.status || 500;
    res.status(status).json({ error: status === 500 ? 'Lỗi cơ sở dữ liệu.' : err.message });
  });
  const server = app.listen(port, '127.0.0.1', () => { console.log(`Dịch vụ đang chạy: http://127.0.0.1:${port}`); process.send?.('ready'); });
  server.on('error', err => { console.error(err.message); db?.close(); process.exit(1); });
  const close = () => { server.close(() => { db?.close(); process.exit(0); }); server.closeIdleConnections(); };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
  process.on('message', message => { if (message === 'stop') close(); });
}
