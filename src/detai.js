import { createApp, openDatabase, required, run } from './common.js';

const app = createApp('Đề tài');
const db = openDatabase('detai');
const find = id => db.prepare('SELECT * FROM DETAI WHERE maDT = ?').get(id);
app.get('/detai', (req, res) => res.json(db.prepare('SELECT * FROM DETAI ORDER BY maDT').all()));
app.get('/detai/:maDT', (req, res) => {
  const item = find(req.params.maDT);
  if (!item) return res.status(404).json({ error: 'Không tìm thấy đề tài.' });
  res.json(item);
});
app.post('/detai', (req, res) => {
  required(req.body, ['maDT', 'tenDeTai']);
  const { maDT, tenDeTai, moTa = '' } = req.body;
  if (typeof moTa !== 'string') return res.status(400).json({ error: 'Mô tả phải là chuỗi.' });
  db.prepare('INSERT INTO DETAI VALUES (?, ?, ?)').run(maDT, tenDeTai, moTa);
  res.status(201).json(find(maDT));
});
app.put('/detai/:maDT', (req, res) => {
  if (!find(req.params.maDT)) return res.status(404).json({ error: 'Không tìm thấy đề tài.' });
  required(req.body, ['tenDeTai']);
  const { tenDeTai, moTa = '' } = req.body;
  if (typeof moTa !== 'string') return res.status(400).json({ error: 'Mô tả phải là chuỗi.' });
  db.prepare('UPDATE DETAI SET tenDeTai = ?, moTa = ? WHERE maDT = ?').run(tenDeTai, moTa, req.params.maDT);
  res.json(find(req.params.maDT));
});
app.delete('/detai/:maDT', (req, res) => {
  const result = db.prepare('DELETE FROM DETAI WHERE maDT = ?').run(req.params.maDT);
  if (!result.changes) return res.status(404).json({ error: 'Không tìm thấy đề tài.' });
  res.status(204).end();
});
run(app, Number(process.env.DT_PORT || 3002), db);
