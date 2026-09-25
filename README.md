# Student Event App

Ứng dụng quản lý sự kiện sinh viên gồm:

- Mobile: Expo, React Native, TypeScript và Expo Router.
- Backend: Node.js, Express, TypeScript, Prisma và SQLite.
- Baseline hiện tại: danh sách và tìm kiếm sự kiện qua API thật. Chi tiết, đăng ký và lịch cá nhân được giao cho thành viên phụ trách triển khai lại.

## Yêu cầu môi trường

- Node.js 20 hoặc 22 LTS.
- npm.
- Expo Go tương thích Expo SDK 57 nếu chạy trên điện thoại thật.
- Điện thoại và máy tính cùng mạng Wi-Fi khi thử qua LAN.

Kiểm tra môi trường:

```bash
node --version
npm --version
```

## 1. Clone và cài đặt

```bash
git clone <URL_REPOSITORY>
cd student-event-app
```

### Backend

```bash
cd server
npm install
```

Tạo file cấu hình từ mẫu.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Nội dung mặc định của `server/.env`:

```dotenv
DATABASE_URL="file:./dev.db"
PORT=3000
```

Tạo SQLite database, áp migration và seed 3 sự kiện:

```bash
npm run db:deploy
npm run db:seed
```

Seed dùng `upsert`, vì vậy có thể chạy lại mà không tạo dữ liệu trùng.

### Mobile

Mở terminal khác:

```bash
cd mobile
npm install
```

Tạo file cấu hình:

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Sửa `mobile/.env` để trỏ tới backend.

Điện thoại thật:

```dotenv
EXPO_PUBLIC_API_URL=http://IP_LAN_CUA_MAY_TINH:3000
```

Ví dụ:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

Các địa chỉ thường dùng:

| Nơi chạy app | API URL |
| --- | --- |
| Điện thoại thật cùng Wi-Fi | `http://<IP-LAN-máy-tính>:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| Web hoặc iOS Simulator trên cùng máy | `http://localhost:3000` |

Trên Windows, tìm IP LAN bằng:

```powershell
ipconfig
```

Chọn `IPv4 Address` của Wi-Fi/Ethernet đang kết nối cùng mạng với điện thoại.

## 2. Chạy ứng dụng

Cần giữ hai terminal hoạt động đồng thời.

Terminal 1 — backend:

```bash
cd server
npm run dev
```

Khi thành công sẽ hiện:

```text
API listening on http://0.0.0.0:3000
```

Terminal 2 — mobile:

```bash
cd mobile
npm start -- --clear
```

Dùng Expo Go quét QR. Tùy chọn khác trong terminal Expo:

- Nhấn `a` để mở Android Emulator.
- Nhấn `w` để mở bản web.

Sau khi sửa `mobile/.env`, cần dừng Expo và chạy lại với `--clear`.

## 3. Kiểm tra kết nối

Trên máy tính:

```text
http://localhost:3000/events
```

Trên trình duyệt điện thoại:

```text
http://IP_LAN_CUA_MAY_TINH:3000/events
```

Trình duyệt hiển thị JSON là đúng; UI được hiển thị trong Expo Go.

Nếu điện thoại không mở được JSON:

- Kiểm tra backend vẫn đang chạy bằng `npm run dev`.
- Kiểm tra lại IP sau khi đổi Wi-Fi hoặc khởi động máy.
- Đảm bảo hai thiết bị cùng mạng và router không bật client/AP isolation.
- Cho phép Node.js qua Windows Firewall trên mạng Private.

## 4. Dữ liệu hiện tại

Schema nền đã có `User`, `Event`, `Registration` và `Note`. Baseline hiện chỉ seed 3 sự kiện; người phụ trách luồng đăng ký sẽ bổ sung demo user và logic persistence trong nhánh của mình.

Muốn khôi phục hoặc bổ sung dữ liệu mẫu, chạy lại:

```bash
cd server
npm run db:seed
```

### Xem dữ liệu bằng Prisma Studio

Từ thư mục `server/`, chạy:

```bash
npx prisma studio
```

Trình duyệt sẽ mở `http://localhost:5555`. Có thể xem trực tiếp các bảng `Event`, `User`, `Registration` và `Note`. Ở baseline hiện tại, `Event` có 3 sự kiện mẫu; các bảng còn lại có thể trống.

Prisma Studio và backend có thể chạy đồng thời ở hai terminal khác nhau. Dừng Studio bằng `Ctrl+C` khi không dùng nữa.

## 5. API hiện có

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/events` | Lấy toàn bộ sự kiện, sắp xếp theo thời gian bắt đầu |
| GET | `/events?q=tu-khoa` | Tìm sự kiện có tên chứa từ khóa |

Các endpoint chi tiết, đăng ký, hủy và lịch cá nhân chưa có trong baseline; Quốc triển khai trong `feature/quoc-registration-schedule` theo `EVENT_APP_MVP_SPEC.md`.

Response thành công hiện trả một mảng trong `data`:

```json
{
  "data": [
    {
      "id": "event-future-tech",
      "title": "Seminar Công nghệ và AI",
      "description": "...",
      "location": "Phòng B2.02",
      "startsAt": "2026-10-10T06:30:00.000Z",
      "endsAt": "2026-10-10T09:30:00.000Z"
    }
  ],
  "error": null
}
```

Lỗi có dạng:

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy tài nguyên."
  }
}
```

## 6. Migration và seed

Sau khi thay đổi Prisma schema, tạo migration trong môi trường phát triển:

```bash
cd server
npm run db:migrate -- --name ten_migration
```

Áp các migration đã commit sau khi clone hoặc pull code:

```bash
npm run db:deploy
```

Không commit `server/.env`, `mobile/.env`, file SQLite hoặc `node_modules`.

## 7. Chạy kiểm thử

Backend:

```bash
cd server
npm run typecheck
npm run build
npm test
npm audit
```

`npm test` tạo SQLite test riêng trong thư mục tạm, áp migration thật và không sửa DB demo.

Mobile:

```bash
cd mobile
npx tsc --noEmit
npm run lint
npx expo export --platform web
```

Kết quả kiểm thử gần nhất và các mục chưa thử trên điện thoại được ghi trong [TEST_REPORT.md](./TEST_REPORT.md).

## 8. Phân công nhóm

Bảng này là phân công triển khai trong repository. File đăng ký đề tài ban đầu chỉ là bản tạm; khi có thay đổi, cả nhóm cập nhật bảng này và checklist của mốc.

| Thành viên | Luồng tính năng sở hữu | Code và tài liệu phải bàn giao |
| --- | --- | --- |
| **Lương Việt Thái** | **Khám phá sự kiện và tích hợp ứng dụng** | Mobile danh sách/tìm kiếm/loading/error/empty; `GET /events?q=`; navigation và API client dùng chung; integration test tìm kiếm; tài liệu cài đặt, API contract và checklist tích hợp |
| **Trần Chí Quốc** | **Chi tiết, đăng ký và lịch cá nhân** | Màn chi tiết và tab Lịch; API chi tiết/đăng ký/hủy/lịch; phần schema `Registration`; test đăng ký lặp, hủy, chặn hủy sau check-in và persistence; tài liệu luồng đăng ký |
| **Phạm Tấn Đạt** | **QR check-in** | Màn camera/quét QR và xử lý quyền; API check-in; token và `checkedInAt` trong DB; test token sai, chưa đăng ký, lặp, đúng/ngoài giờ và request đồng thời; nhật ký và hướng dẫn test QR trên máy thật |
| **Lê Thanh Kha** | **Ghi chú và tóm tắt AI** | Màn nhập/xem ghi chú; API lưu/đọc note và gọi AI; phần schema `Note`; validation nội dung; test note rỗng/quá dài, quyền sở hữu, AI success/timeout/error; tài liệu cấu hình khóa AI và bằng chứng gọi thật |
| **Chu Anh Khôi** | **Nhắc giờ, công cụ demo và phát hành** | Local notification khi đăng ký/hủy; trạng thái từ chối quyền; script/trang tạo QR cho 3 event mẫu; test logic lên/hủy lịch; UI polish/animation; EAS Build/APK; tài liệu build, ảnh, video và slide demo |

### Phân theo mốc

| Mốc | Người chính | Người phối hợp | Kết quả |
| --- | --- | --- | --- |
| **0 — Nền tảng** | Thái làm kết nối mobile/API; Quốc làm schema và seed nền | Mỗi người review phần sẽ dùng | Expo gọi được Express/SQLite qua LAN; migration và seed ổn định |
| **1 — Khám phá và đăng ký** | Thái sở hữu Khám phá; Quốc sở hữu Chi tiết/Đăng ký/Lịch | Hai người test chéo API và UI của nhau | Tìm kiếm → chi tiết → đăng ký → lịch chạy bằng DB thật |
| **2 — QR và nhắc giờ** | Đạt sở hữu QR check-in; Khôi sở hữu notification | Thái nối route; Quốc và Kha review test biên | QR đúng/sai/lặp/ngoài giờ; quyền camera; lên và hủy nhắc giờ |
| **3 — Ghi chú và AI** | Kha sở hữu toàn bộ luồng | Quốc review DB/API; Thái review navigation; Đạt test trên máy; Khôi review UI | Ghi chú → AI thật → lưu/xem lại; lỗi AI không tạo kết quả giả |
| **4 — Hoàn thiện** | Khôi sở hữu build/demo; Thái sở hữu tích hợp release | Mỗi người sửa lỗi và viết phần báo cáo của tính năng mình | APK, video, slide, báo cáo và ba luồng demo hoàn chỉnh |

### Quy tắc làm việc

- Mỗi người sở hữu một luồng end-to-end: tự làm phần DB/schema cần thiết, API, mobile UI, xử lý lỗi, test và tài liệu của tính năng đó. Không tách một người chỉ làm backend hoặc chỉ làm kiểm thử.
- Mỗi người tự viết mục báo cáo và cung cấp ảnh/log/test result cho phần mình; Thái chỉ tổng hợp và kiểm tra tính nhất quán.
- Người phụ trách một tính năng phải bàn giao loading/error/empty, khóa thao tác lặp, test tự động và checklist máy thật; không chỉ bàn giao giao diện chạy happy path.
- Backend và mobile tuân thủ API contract trong specs; không tự tạo dữ liệu giả riêng trên từng màn hình.
- Mỗi nhánh chỉ tập trung một tính năng, ví dụ `feature/qr-check-in` hoặc `feature/ai-notes`.
- Trước khi gửi pull request hoặc merge: chạy typecheck, lint phần mobile, build/test phần server có liên quan và ghi kết quả thật.
- Không merge khi test đang fail. Phần chưa thử trên điện thoại phải ghi `NOT RUN`, không tự đánh dấu pass.
- Thái chịu trách nhiệm tích hợp/review chung và luồng Khám phá, không mặc định làm thay code, test hoặc tài liệu chưa hoàn thành của thành viên khác.
- Khi API contract hoặc schema thay đổi, người thay đổi phải báo nhóm và cập nhật README/spec/test trong cùng pull request.

## 9. Lỗi thường gặp

### `Environment variable not found: DATABASE_URL`

Chưa có `server/.env`. Copy lại từ `.env.example`, sau đó chạy `npm run db:deploy`.

### Mobile báo `Không thể kết nối đến máy chủ`

1. Giữ `npm run dev` đang chạy trong `server/`.
2. Mở URL `/events` trên trình duyệt điện thoại để thử LAN.
3. Kiểm tra `mobile/.env` không dùng `localhost` trên điện thoại thật.
4. Restart Expo bằng `npm start -- --clear`.

### Terminal còn dòng `API listening` nhưng app không kết nối

Dòng đó có thể là log cũ sau khi terminal hoặc VS Code reload. Kiểm tra thật bằng:

```powershell
Invoke-RestMethod http://localhost:3000/events
```

Nếu không có response, chạy lại `npm run dev`.

### Prisma báo file DLL đang được sử dụng trên Windows

Dừng backend trước khi chạy `npm install` hoặc `npm run prisma:generate`, sau đó khởi động lại `npm run dev`.
