import express from 'express';
import path from 'node:path';
import { createApp, root, run } from './common.js';
const app = createApp('API Gateway', { landing: false });
const services = {
  sinhvien: process.env.SV_URL || `http://127.0.0.1:${process.env.SV_PORT || 3001}`,
  detai: process.env.DT_URL || `http://127.0.0.1:${process.env.DT_PORT || 3002}`,
  dangky: process.env.DK_URL || `http://127.0.0.1:${process.env.DK_PORT || 3003}`,
};
app.get('/api/health', async (req, res) => {
  const results = await Promise.all(Object.entries(services).map(async ([name, url]) => {
    try { const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2200) }); return { name, status: response.ok ? 'up' : 'down' }; }
    catch { return { name, status: 'down' }; }
  }));
  res.json(results);
});
app.use('/api/:service', async (req, res) => {
  const name = req.params.service;
  if (!Object.hasOwn(services, name)) return res.status(404).json({ error: 'Dịch vụ không tồn tại.' });
  try {
    const response = await fetch(`${services[name]}/${name}${req.url === '/' ? '' : req.url}`, {
      method: req.method, headers: { 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(6000),
    });
    res.status(response.status);
    if (response.status === 204) return res.end();
    res.type('json').send(await response.text());
  } catch { res.status(503).json({ error: 'Dịch vụ tạm thời không sẵn sàng. Vui lòng thử lại.' }); }
});
app.use(express.static(path.join(root, 'public')));
app.get('/client', (req, res) => res.redirect('/'));
run(app, Number(process.env.GATEWAY_PORT || 3000));
