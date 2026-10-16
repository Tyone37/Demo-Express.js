import { createApp, openDatabase, required, run } from '../../src/common.js';

const app = createApp('Sinh viên');
const db = openDatabase('sinhvien');
const find = id => db.prepare('SELECT * FROM SINHVIEN WHERE maSV = ?').get(id);
app.get('/sinhvien', (req, res) => res.json(db.prepare('SELECT * FROM SINHVIEN ORDER BY maSV').all()));
app.get('/sinhvien/:maSV', (req, res) => {
  const item = find(req.params.maSV);
  if (!item) return res.status(404).json({ error: 'Không tìm thấy sinh viên.' });
  res.json(item);
});
app.post('/sinhvien', (req, res) => {
  required(req.body, ['maSV', 'hoTen', 'lop']);
  const { maSV, hoTen, lop } = req.body;
  db.prepare('INSERT INTO SINHVIEN VALUES (?, ?, ?)').run(maSV, hoTen, lop);
  res.status(201).json(find(maSV));
});
app.put('/sinhvien/:maSV', (req, res) => {
  if (!find(req.params.maSV)) return res.status(404).json({ error: 'Không tìm thấy sinh viên.' });
  required(req.body, ['hoTen', 'lop']);
  db.prepare('UPDATE SINHVIEN SET hoTen = ?, lop = ? WHERE maSV = ?').run(req.body.hoTen, req.body.lop, req.params.maSV);
  res.json(find(req.params.maSV));
});
app.delete('/sinhvien/:maSV', (req, res) => {
  const result = db.prepare('DELETE FROM SINHVIEN WHERE maSV = ?').run(req.params.maSV);
  if (!result.changes) return res.status(404).json({ error: 'Không tìm thấy sinh viên.' });
  res.status(204).end();
});
run(app, Number(process.env.SV_PORT || 3001), db);
