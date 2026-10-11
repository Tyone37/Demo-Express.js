import { randomUUID } from 'node:crypto';
import { createApp, openDatabase, required, run } from './common.js';

const app = createApp('Đăng ký');
const db = openDatabase('dangky');
const find = id => db.prepare('SELECT * FROM DANGKY WHERE maDK = ?').get(id);

// Kiểm tra bằng HTTP, không đọc DB Sinh viên hoặc Đề tài.
async function checkReferences(maSV, maDT) {
  const targets = [
    `${process.env.SV_URL || 'http://127.0.0.1:3001'}/sinhvien/${encodeURIComponent(maSV)}`,
    `${process.env.DT_URL || 'http://127.0.0.1:3002'}/detai/${encodeURIComponent(maDT)}`,
  ];
  for (const url of targets) {
    console.log(`Đăng ký gọi API: GET ${url}`);
    let response;
    try { response = await fetch(url, { signal: AbortSignal.timeout(2000) }); await response.arrayBuffer(); }
    catch { throw Object.assign(new Error('Dịch vụ Sinh viên hoặc Đề tài không sẵn sàng.'), { status: 503 }); }
    if (response.status === 404) throw Object.assign(new Error('Mã sinh viên hoặc đề tài không tồn tại.'), { status: 404 });
    if (!response.ok) throw Object.assign(new Error('Dịch vụ phụ thuộc trả lỗi.'), { status: 503 });
  }
}
app.get('/dangky', (req, res) => res.json(db.prepare('SELECT * FROM DANGKY ORDER BY ngayDangKy').all()));
app.get('/dangky/:maDK', (req, res) => {
  const item = find(req.params.maDK);
  if (!item) return res.status(404).json({ error: 'Không tìm thấy đăng ký.' });
  res.json(item);
});
app.post('/dangky', async (req, res) => {
  required(req.body, ['maSV', 'maDT']);
  const { maSV, maDT } = req.body;
  await checkReferences(maSV, maDT);
  const maDK = `DK-${randomUUID()}`;
  db.prepare('INSERT INTO DANGKY VALUES (?, ?, ?, ?)').run(maDK, maSV, maDT, new Date().toISOString());
  res.status(201).json(find(maDK));
});
app.put('/dangky/:maDK', async (req, res) => {
  if (!find(req.params.maDK)) return res.status(404).json({ error: 'Không tìm thấy đăng ký.' });
  required(req.body, ['maSV', 'maDT']);
  const { maSV, maDT } = req.body;
  await checkReferences(maSV, maDT);
  const result = db.prepare('UPDATE DANGKY SET maSV = ?, maDT = ? WHERE maDK = ?').run(maSV, maDT, req.params.maDK);
  if (!result.changes) return res.status(404).json({ error: 'Không tìm thấy đăng ký.' });
  res.json(find(req.params.maDK));
});
app.delete('/dangky/:maDK', (req, res) => {
  const result = db.prepare('DELETE FROM DANGKY WHERE maDK = ?').run(req.params.maDK);
  if (!result.changes) return res.status(404).json({ error: 'Không tìm thấy đăng ký.' });
  res.status(204).end();
});
run(app, Number(process.env.DK_PORT || 3003), db);
