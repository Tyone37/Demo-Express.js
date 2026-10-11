import { openDatabase } from '../src/common.js';

const fixtures = {
  sinhvien: [
    ['SV001', 'Nguyễn Văn An', 'CNTT01'],
    ['SV002', 'Trần Thị Bình', 'CNTT01'],
    ['SV003', 'Lê Minh Châu', 'CNTT02'],
  ],
  detai: [
    ['DT001', 'Quản lý đồ án tốt nghiệp', 'API Express.js tổ chức theo kiến trúc hướng dịch vụ.'],
    ['DT002', 'Thư viện số', 'Quản lý sách và mượn trả.'],
    ['DT003', 'Theo dõi thực tập', 'Quản lý sinh viên và báo cáo thực tập.'],
  ],
};
for (const service of ['sinhvien', 'detai', 'dangky']) {
  const db = openDatabase(service);
  try {
    if (fixtures[service]) {
      const table = service === 'sinhvien' ? 'SINHVIEN' : 'DETAI';
      const statement = db.prepare(`INSERT OR IGNORE INTO ${table} VALUES (?, ?, ?)`);
      db.exec('BEGIN');
      for (const row of fixtures[service]) statement.run(...row);
      db.exec('COMMIT');
    }
    console.log(`${service}: đã chuẩn bị DB${fixtures[service] ? ' và dữ liệu mẫu (giữ nguyên các mã đã có)' : ', chưa tạo đăng ký'}.`);
  } finally { db.close(); }
}
