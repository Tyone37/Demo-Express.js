# Demo cơ bản giữa kỳ Express.js

Dựa trên phần II của báo cáo: CRUD sinh viên, đề tài và đăng ký đồ án. Ba dịch vụ Express chạy riêng, mỗi dịch vụ lưu dữ liệu bằng SQLite. Đăng ký gọi API Sinh viên và Đề tài qua HTTP để kiểm tra trước khi ghi.

## Chạy demo

Cần Node.js 22.13 trở lên (khuyến nghị 24) và npm. Không cần cài server CSDL riêng.

```powershell
cd D:\SOA\Demo
npm.cmd install
npm.cmd run seed
npm.cmd start
```

Mở **http://127.0.0.1:3001/client/**. Ctrl+C để dừng. Trên macOS/Linux dùng `npm` thay cho `npm.cmd`. Node có thể in ExperimentalWarning cho SQLite; demo vẫn chạy được.

Seed tạo SV001–SV003 và DT001–DT003, giữ các mã đã có. Ba file DB nằm trong `data/`; dữ liệu vẫn còn khi tắt và chạy lại.

## Trình bày khoảng 5 phút

1. Giới thiệu ba dịch vụ: Sinh viên cổng 3001, Đề tài cổng 3002, Đăng ký cổng 3003. Gọi `http://127.0.0.1:3001/` để xem Hello World.
2. Trên trang HTML, thêm sinh viên và đề tài thử. Chọn Xem, Sửa, Xóa để minh họa CRUD. Sau khi sửa, chọn Xem để đọc lại từ API.
3. Tạo đăng ký cho SV001 và DT001. Xem response 201 với mã/ngày đăng ký tự sinh. Terminal Đăng ký in hai URL được gọi, minh họa phối hợp dịch vụ.
4. Gửi lại cùng cặp: nhận 409. Nhập mã không tồn tại: nhận 404, không tạo đăng ký. Sửa rồi xóa đăng ký.
5. Nếu cần minh họa lỗi dịch vụ, chạy riêng theo hướng dẫn bên dưới, dừng Đề tài rồi tạo đăng ký: nhận 503.

## API cơ bản

| Dịch vụ | URL gốc | Body tạo mới |
|---|---|---|
| Sinh viên | `http://127.0.0.1:3001/sinhvien` | `{"maSV":"SV004","hoTen":"Nguyễn Văn An","lop":"CNTT01"}` |
| Đề tài | `http://127.0.0.1:3002/detai` | `{"maDT":"DT004","tenDeTai":"Quản lý đồ án","moTa":"Demo"}` |
| Đăng ký | `http://127.0.0.1:3003/dangky` | `{"maSV":"SV001","maDT":"DT001"}` |

Mỗi URL hỗ trợ GET danh sách, POST tạo. Thêm `/mã` để GET chi tiết, PUT sửa hoặc DELETE xóa. PUT Sinh viên gửi `hoTen, lop`; PUT Đề tài gửi `tenDeTai, moTa`; PUT Đăng ký gửi `maSV, maDT`.

POST/PUT dùng `Content-Type: application/json`; sai định dạng nhận 415. Thành công: đọc/sửa 200, tạo 201, xóa 204. Thiếu trường 400, không tìm thấy 404, trùng 409, dịch vụ phụ thuộc dừng 503.

## Dừng riêng một dịch vụ

Dừng `npm start`, mở ba terminal trong thư mục Demo, mỗi terminal chạy một lệnh:

```powershell
npm.cmd run start:sinhvien
npm.cmd run start:detai
npm.cmd run start:dangky
```

Ctrl+C tại terminal Đề tài, thử đăng ký rồi chạy lại `npm.cmd run start:detai`. Đây là xử lý lỗi có kiểm soát và khởi động lại thủ công.

## Mã nguồn để giải thích

- `src/sinhvien.js`, `src/detai.js`: route CRUD và truy vấn SQL.
- `src/dangky.js`: CRUD đăng ký; `checkReferences` gọi hai API bằng `fetch`.
- `src/common.js`: kết nối SQLite, middleware JSON và trả lỗi.
- `sql/`: cấu trúc ba bảng; `public/index.html`: client đơn giản.

Phạm vi giữa kỳ gồm CRUD và đăng ký. Một sinh viên có thể chọn nhiều đề tài nhưng không trùng cặp. Khi xóa dữ liệu, người trình bày cần xóa đăng ký liên quan trước; demo chưa tự kiểm tra/xóa lan giữa các dịch vụ. JWT, tính điểm và các cơ chế SOA nâng cao thuộc hướng phát triển trong báo cáo.
