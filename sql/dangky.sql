-- Mã tham chiếu được kiểm tra qua HTTP, không tạo FK sang DB dịch vụ khác.
CREATE TABLE IF NOT EXISTS DANGKY (
  maDK TEXT PRIMARY KEY,
  maSV TEXT NOT NULL,
  maDT TEXT NOT NULL,
  ngayDangKy TEXT NOT NULL,
  UNIQUE (maSV, maDT)
);
