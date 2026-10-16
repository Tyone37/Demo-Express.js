# SOA Workspace — Quản lý đồ án tốt nghiệp

Ứng dụng demo Express 5 / Node.js 22.13+ (khuyến nghị Node 24), lưu dữ liệu SQLite.

Cập nhật ngày **17/10/2026**. Môi trường đã kiểm tra: **Node.js v24.13.0, Express 5.2.1**; package.json khai báo Express ^5.1.0.

## Chạy

```powershell
cd D:\SOA\Demo
npm.cmd install
npm.cmd run seed
npm.cmd start
```

Mở http://127.0.0.1:3000. Ctrl+C dừng toàn bộ tiến trình. Seed giữ nguyên dữ liệu đã có; không cần seed lại khi khởi động. Trên Linux/macOS dùng `npm`.

## Kiến trúc

```text
Web client (public/)
        |
API Gateway :3000 (/api/sinhvien, /api/detai, /api/dangky)
        |                |                  |
Sinh viên :3001     Đề tài :3002       Đăng ký :3003
        |                |                  |
sinhvien.sqlite     detai.sqlite       dangky.sqlite
                                            |
                               HTTP → Sinh viên / Đề tài
```

- `services/sinhvien/index.js`: CRUD hồ sơ sinh viên, sở hữu bảng SINHVIEN.
- `services/detai/index.js`: CRUD đề tài, sở hữu bảng DETAI.
- `services/dangky/index.js`: CRUD đăng ký, xác thực tham chiếu bằng HTTP với timeout; sở hữu bảng DANGKY.
- `src/gateway.js`: phục vụ web và chuyển tiếp API; tổng hợp trạng thái qua `/api/health`. Không đọc cơ sở dữ liệu.
- `src/common.js`: hạ tầng dùng chung (JSON, lỗi, SQLite, lifecycle), không chứa nghiệp vụ chéo service.
- `src/start.js`: chạy bốn tiến trình riêng; dừng toàn bộ khi một tiến trình thoát ngoài dự kiến.
- `public/`: HTML, CSS, JavaScript riêng. Dashboard, tìm kiếm, CRUD, chọn sinh viên/đề tài, nhật ký API và trạng thái service. `index.previous.html` lưu giao diện có sẵn trước lần chỉnh sửa này.
- `sql/`: schema riêng; `data/`: ba file DB bền vững. Không truy vấn hoặc JOIN DB của service khác.
- Các entry point cũ `src/sinhvien.js`, `src/detai.js`, `src/dangky.js` vẫn chạy được.

Các service hiện dùng chung gói npm để demo gọn nhẹ, nhưng chạy tiến trình và cổng riêng. Mỗi service có thể khởi động/dừng độc lập.

## Chạy độc lập và minh họa lỗi

Mở bốn terminal, lần lượt chạy:

```powershell
npm.cmd run start:sinhvien
npm.cmd run start:detai
npm.cmd run start:dangky
npm.cmd run start:gateway
```

Dừng riêng Đề tài: Sinh viên vẫn dùng được, tạo đăng ký trả 503. Bấm Làm mới dữ liệu để cập nhật trạng thái; chạy lại service để phục hồi. Không dùng `npm start` cho bài trình diễn dừng riêng vì launcher chủ động dừng cả nhóm khi một tiến trình thoát.

## Cấu hình

| Biến | Mặc định | Mục đích |
|---|---|---|
| GATEWAY_PORT | 3000 | Cổng giao diện / Gateway |
| SV_PORT, DT_PORT, DK_PORT | 3001, 3002, 3003 | Cổng service |
| SV_URL, DT_URL, DK_URL | http://127.0.0.1:cổng tương ứng | Địa chỉ service Gateway gọi; Đăng ký dùng SV_URL/DT_URL |
| DATA_DIR | Demo/data | Thư mục lưu SQLite |

Các tiến trình hiện bind 127.0.0.1 để chạy trên máy cá nhân. Muốn triển khai trên nhiều máy cần bổ sung cấu hình địa chỉ bind và mạng truy cập, đặt DATA_DIR riêng và cấu hình URL phụ thuộc; chỉ đổi URL chưa đủ để truy cập từ máy khác.

## API

Gọi qua Gateway `/api/{service}` hoặc trực tiếp `http://127.0.0.1:{port}/{service}`.

| Service | POST body |
|---|---|
| sinhvien | `{"maSV":"SV004","hoTen":"Nguyễn Văn An","lop":"CNTT01"}` |
| detai | `{"maDT":"DT004","tenDeTai":"Quản lý đồ án","moTa":"Demo"}` |
| dangky | `{"maSV":"SV001","maDT":"DT001"}` |

GET danh sách; POST tạo; `/:id` hỗ trợ GET chi tiết, PUT, DELETE. PUT gửi các trường như POST, trừ mã sinh viên/đề tài là bất biến. Đăng ký tự sinh mã và ngày. Mỗi service có GET `/health`; Gateway có GET `/api/health` trả trạng thái từng service.

HTTP: 200 đọc/sửa, 201 tạo, 204 xóa, 400 thiếu trường/JSON sai, 404 không tồn tại, 409 trùng mã/cặp, 415 sai Content-Type, 503 phụ thuộc không sẵn sàng.

## Kiểm tra

```powershell
npm.cmd test
```

Ngày 17/10/2026, `npm.cmd test` chạy đạt **1 bài kiểm thử tích hợp, 0 bài thất bại**. Bài kiểm thử chạy bốn tiến trình trên cổng 14300–14303 và DB tạm: CRUD qua Gateway, validation, trùng lặp, mã tham chiếu không tồn tại, service dừng, phục hồi dữ liệu và lỗi 503; đồng thời kiểm tra JSON sai cú pháp (400), sai Content-Type (415) và tên service không hợp lệ (404). Không sửa DB demo.

Kiểm tra thủ công trên trình duyệt: dashboard hiển thị dữ liệu, biểu mẫu sửa khóa trường mã, màn hình kiến trúc hiển thị trạng thái ba service; làm mới đăng ký giữ lựa chọn còn hợp lệ. Đây chưa phải bộ kiểm thử giao diện tự động.

## Sử dụng giao diện

- **Tổng quan**: số bản ghi và bốn đăng ký gần nhất.
- **Sinh viên / Đề tài / Đăng ký**: thêm, xem phản hồi API, sửa, xóa và tìm kiếm trong danh sách.
- **Đăng ký**: chọn mã từ danh sách, không nhập tùy ý mã mới; dùng API hoặc bài kiểm thử để minh họa mã không tồn tại.
- **Kiến trúc dịch vụ**: sơ đồ và trạng thái endpoint health. Bấm **Làm mới dữ liệu** để tải lại; không có cập nhật liên tục tự động.
- **Nhật ký API**: yêu cầu và phản hồi gần nhất qua Gateway. URL HTTP nội bộ được ghi ở terminal Đăng ký.

Làm mới ở màn hình Đăng ký cập nhật danh sách chọn và giữ giá trị còn hợp lệ. Trong lúc tải bản ghi để sửa hoặc ghi dữ liệu, giao diện chặn chuyển màn hình và thao tác lặp.

## Kịch bản trình bày

1. Chạy seed nếu cần, mở Tổng quan và Kiến trúc dịch vụ.
2. Thêm sinh viên/đề tài thử, tìm kiếm, sửa và đọc lại.
3. Tạo đăng ký hợp lệ, xem HTTP 201 và log service Đăng ký.
4. Tạo lại cùng cặp để xem 409; kiểm tra mã không tồn tại qua API để xem 404.
5. Chạy bốn terminal riêng, dừng Đề tài để minh họa 503 và Sinh viên vẫn đọc được; chạy lại Đề tài để kiểm tra dữ liệu còn lưu.
6. Xóa đăng ký thử trước khi xóa sinh viên/đề tài thử.

Báo cáo đồng bộ nằm tại `../Giua ky/Bao cao giua ky ExpressJS.md`, kèm bản Word và HTML.

## Giới hạn nghiệp vụ

Một sinh viên có thể đăng ký nhiều đề tài nhưng không trùng cặp. Xóa đăng ký liên quan trước khi xóa sinh viên/đề tài: bản demo chưa chặn xóa dữ liệu cha đang được tham chiếu, kể cả khi xóa tuần tự qua API hoặc giao diện. Chưa có giao dịch phân tán; kiểm tra tham chiếu và ghi đăng ký không phải một thao tác nguyên tử xuyên service. Chưa có xác thực/phân quyền; phù hợp trình diễn cục bộ.
