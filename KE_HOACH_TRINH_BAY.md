# Kịch bản trình bày demo Express.js và SOA

Đối chiếu mã nguồn ngày 19/10/2026. Thời lượng đề xuất: 8–10 phút, chưa gồm hỏi đáp.

## 1. Mục tiêu

Chứng minh ba ý bằng thao tác thực tế:

1. CRUD qua API Gateway hoạt động và lưu dữ liệu vào SQLite.
2. Đăng ký phối hợp với Sinh viên và Đề tài qua HTTP, không đọc DB chéo.
3. Khi một dịch vụ phụ thuộc dừng, hệ thống trả lỗi có kiểm soát; dịch vụ không phụ thuộc vẫn dùng được.

## 2. Chuẩn bị trước buổi trình bày

- Cài dependencies trước buổi demo: `npm.cmd install` trong `D:\SOA\Demo`.
- Chạy `npm.cmd run seed` nếu cần dữ liệu mẫu. Seed không xóa đăng ký hay ghi đè mã đã có.
- Chạy `npm.cmd test`. Lần kiểm tra ngày 19/10/2026 đạt 1 bài tích hợp, 0 thất bại. Test dùng DB tạm và cổng 14300–14303, không sửa DB demo; chưa kiểm chứng tương tác giao diện.
- Kiểm tra các mã minh họa `SVDEMO19`, `DTDEMO19A`, `DTDEMO19B` chưa tồn tại. Nếu đã có, chọn hậu tố khác và thay nhất quán trong kịch bản.
- Mở trình duyệt tại http://127.0.0.1:3000; đặt mức phóng to để người xem đọc được Nhật ký API.
- Mở sẵn các file code trong mục 5, cùng bốn terminal có tên tương ứng dịch vụ.
- Chạy riêng bốn tiến trình ngay từ đầu, mỗi terminal ở `D:\SOA\Demo` chạy một lệnh:

```powershell
npm.cmd run start:sinhvien
npm.cmd run start:detai
npm.cmd run start:dangky
npm.cmd run start:gateway
```

Không chạy đồng thời `npm start`: cổng sẽ bị trùng. Launcher `npm start` dừng cả nhóm khi một tiến trình thoát, nên không phù hợp tình huống dừng riêng dịch vụ.

## 3. Trình tự demo và lời nói gợi ý

| Thời gian | Thao tác | Ý cần nói / minh chứng |
|---|---|---|
| 0:00–1:00 | Mở Tổng quan, sau đó Kiến trúc dịch vụ; bấm Làm mới dữ liệu | “Client gọi Gateway cổng 3000. Ba dịch vụ nghiệp vụ chạy ở 3001–3003 và sở hữu ba DB riêng. Gateway chuyển tiếp API, không truy cập DB.” Chỉ ba trạng thái hoạt động. |
| 1:00–2:30 | Sinh viên: thêm `SVDEMO19`, tên `Nguyễn Minh Demo`, lớp `CNTT01`. Tìm mã, chọn bản ghi, Xem; Sửa lớp thành `CNTT02`, Lưu và Xem lại | Chỉ POST 201, GET 200, PUT 200 trong Nhật ký API. “Nút Xem đọc lại từ API; dữ liệu cập nhật đã được lưu.” Tìm kiếm hiện là lọc dữ liệu trên client. |
| 2:30–3:15 | Đề tài: thêm `DTDEMO19A` tên `Quản lý đồ án SOA`; thêm `DTDEMO19B` tên `Thư viện số` | “Đề tài có API và DB riêng. Chuẩn bị hai đề tài để giải thích quy tắc đăng ký.” |
| 3:15–4:45 | Đăng ký: chọn `SVDEMO19` và `DTDEMO19A`, tạo mới; mở Nhật ký API rồi chuyển terminal Đăng ký | Chỉ HTTP 201, mã DK và ngày tự sinh; chỉ hai dòng GET nội bộ. “Đăng ký hỏi API Sinh viên trước, rồi API Đề tài; cả hai hợp lệ mới ghi DB Đăng ký.” |
| 4:45–5:30 | Tạo lại đúng cặp vừa đăng ký | HTTP 409. Mở `sql/dangky.sql`, chỉ `UNIQUE (maSV, maDT)`. “Chặn trùng cặp, chưa giới hạn mỗi sinh viên một đề tài.” |
| 5:30–6:00 | Đăng ký `SVDEMO19` với `DTDEMO19B` | HTTP 201, minh chứng một sinh viên có thể có hai đề tài khác nhau. |
| 6:00–7:15 | Mở code luồng đăng ký theo mục 5 | Giải thích ngắn Client → Gateway → route → kiểm tra HTTP → INSERT → response. Không đọc toàn bộ file. |
| 7:15–8:45 | Dừng terminal Đề tài bằng Ctrl+C; Làm mới ở Kiến trúc; Xem sinh viên; gửi POST đăng ký bằng lệnh mục 4 | Đề tài down; Xem sinh viên vẫn 200; đăng ký trả 503. “Tạo đăng ký phụ thuộc Đề tài, còn đọc Sinh viên không phụ thuộc. Health phản ánh trạng thái khi làm mới.” |
| 8:45–9:30 | Chạy lại `npm.cmd run start:detai`; làm mới, Xem đề tài | Đề tài hoạt động trở lại và dữ liệu còn lưu. “Đây là khởi động lại thủ công; dữ liệu bền vững nhờ SQLite.” |
| 9:30–10:00 | Nêu giới hạn; nếu còn thời gian, xóa dữ liệu thử | Chưa có JWT, registry, hàng đợi, tự phục hồi, tính điểm và chặn xóa dữ liệu cha đang được tham chiếu. Xóa cả hai đăng ký thử trước, rồi xóa sinh viên và hai đề tài; DELETE trả 204. |

Nếu chỉ có 5 phút: kiến trúc 40 giây, CRUD sinh viên 50 giây, đăng ký và log 80 giây, trùng 409 30 giây, dừng/khôi phục 80 giây, giới hạn 20 giây. Chuẩn bị đề tài trước; bỏ phần đọc code dài và các lệnh lỗi phụ.

## 4. Lệnh API chuẩn bị sẵn

Chạy trong một terminal PowerShell khác. `curl.exe -i` hiển thị cả mã HTTP; dùng stdin để chuyển JSON tránh vấn đề dấu nháy trên Windows.

### Mã sinh viên không tồn tại: mong đợi 404

Thực hiện khi cả ba dịch vụ đang chạy. Xác nhận `SV_KHONG_TON_TAI_19` không có trong danh sách.

```powershell
'{"maSV":"SV_KHONG_TON_TAI_19","maDT":"DTDEMO19A"}' | curl.exe -i -X POST http://127.0.0.1:3000/api/dangky -H "Content-Type: application/json" --data-binary '@-'
```

Form đăng ký chỉ chọn mã từ danh sách nên không minh họa trường hợp này bằng cách nhập tùy ý trên UI.

### Đề tài đang dừng: mong đợi 503

Sinh viên `SVDEMO19` phải còn tồn tại. Có thể dùng lại cặp đã đăng ký: code kiểm tra HTTP trước khi INSERT nên trả 503 trước khi kiểm tra trùng trong SQLite.

```powershell
'{"maSV":"SVDEMO19","maDT":"DTDEMO19A"}' | curl.exe -i -X POST http://127.0.0.1:3000/api/dangky -H "Content-Type: application/json" --data-binary '@-'
```

Sau khi làm mới lúc Đề tài dừng, lựa chọn đề tài trên form có thể trống. Vì vậy dùng lệnh trên để minh họa 503 ổn định.

### Chính sách JSON: tùy chọn, mong đợi 415

```powershell
curl.exe -i -X POST http://127.0.0.1:3000/api/sinhvien -H "Content-Type: text/plain" --data-binary hello
```

Các yêu cầu chạy bằng terminal không xuất hiện trong Nhật ký API của giao diện; xem phản hồi ngay trong terminal.

## 5. Thứ tự mở code

1. `package.json`: scripts chạy từng dịch vụ; `src/start.js`: launcher bốn tiến trình. Phần demo đang dùng bốn terminal riêng để dừng độc lập.
2. `public/app.js`: `onsubmit` tạo body; `call()` dùng URL `/api/...` và `fetch`; `load()` tải dữ liệu và health. Tìm kiếm lọc danh sách đã tải, không gửi API tìm kiếm riêng.
3. `src/gateway.js`: bảng `services` ánh xạ địa chỉ; route `/api/:service` chuyển tiếp method/body và giữ mã HTTP của service. `/api/health` hỏi health ba dịch vụ.
4. `services/dangky/index.js`: route POST `/dangky`; `required` → `await checkReferences` → UUID → INSERT → 201. Trong `checkReferences`, hai HTTP GET chạy lần lượt, timeout 2 giây mỗi lần.
5. `sql/dangky.sql`: `UNIQUE (maSV, maDT)` áp dụng cho cả thêm và sửa; `src/common.js` chuyển lỗi UNIQUE thành 409, xử lý JSON và Content-Type.
6. Nếu được hỏi CRUD: mở `services/sinhvien/index.js`, chỉ một route POST và một PUT. Các file `src/sinhvien.js`, `src/detai.js`, `src/dangky.js` hiện chỉ là entry point tương thích.

## 6. Câu hỏi dễ gặp

- **Vì sao có Gateway?** Đưa một địa chỉ API cho client, phục vụ web và tổng hợp health; nghiệp vụ đăng ký nằm trong service Đăng ký.
- **Gateway có kiểm tra sinh viên/đề tài không?** Không. Đăng ký trực tiếp gọi hai service để kiểm tra trước khi ghi.
- **Một sinh viên được hai đề tài không?** Có, nếu hai mã đề tài khác nhau. UNIQUE hiện chặn cặp trùng.
- **Có khóa ngoại giữa ba DB không?** Không. Kiểm tra tham chiếu qua HTTP khi tạo/sửa, chưa bảo đảm toàn vẹn khi xóa hoặc khi các thao tác chạy đồng thời.
- **Có liên kết lỏng hoàn toàn không?** Giảm phụ thuộc chi tiết lưu trữ nhờ API và DB riêng, nhưng ghi đăng ký vẫn phụ thuộc khả năng đáp ứng của Sinh viên và Đề tài.
- **Có bất đồng bộ nghiệp vụ không?** Chưa. async/await phục vụ chờ I/O; client vẫn chờ kết quả đăng ký. Chưa có hàng đợi.
- **Có tự phục hồi hoặc dò tìm động không?** Chưa. Health chỉ báo trạng thái; khởi động lại thủ công. URL cấu hình qua biến môi trường, chưa có registry.
- **Minh chứng SOA nào rõ nhất?** Liên kết lỏng về dữ liệu, tái sử dụng API, cộng tác trong luồng đăng ký; middleware JSON minh họa chính sách đơn giản.
- **Control coupling?** `call(..., log=false)` trong `public/app.js` truyền cờ điều khiển việc ghi Nhật ký API. `createApp(..., { landing: false })` điều khiển đăng ký route trang gốc.
- **Stamp coupling?** `required(req.body, fields)` nhận cả object và kiểm tra các trường được chỉ định; ví dụ rõ khi body có thêm trường không dùng. Không coi mọi object truyền vào là stamp coupling.

## 7. Minh chứng nên lưu sau buổi chạy thử

Chụp màn hình kiến trúc đủ ba service up; đăng ký 201; log hai GET nội bộ; trùng cặp 409; Đề tài down kèm Sinh viên 200 và đăng ký 503; kết quả npm test. Lần đọc mã và chạy test này chưa thay thế buổi chạy thử tương tác trên trình duyệt.
