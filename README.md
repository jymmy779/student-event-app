# Student Event App

Theo dõi phân công hiện hành, phụ thuộc và nhật ký triển khai tại [docs/PROGRESS.md](./docs/PROGRESS.md).

Ứng dụng quản lý sự kiện sinh viên gồm:

- Mobile: Expo, React Native, TypeScript và Expo Router.
- Backend: Node.js, Express, TypeScript, Prisma và SQLite.
- Hiện có: khám phá và chi tiết sự kiện, đăng nhập/session, quản lý sự kiện cho organizer, đăng ký/lịch cá nhân, QR/check-in và ghi chú/tóm tắt AI qua API backend.

## Yêu cầu môi trường

- Node.js 20 hoặc 22 LTS.
- npm.
- Expo Go tương thích Expo SDK 58 nếu chạy trên điện thoại thật.
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
ORGANIZER_INVITE_CODE="ma-moi-rieng-tu"
GEMINI_API_KEY=""
# GEMINI_MODEL="gemini-3.5-flash-lite"
```

Tạo SQLite database, áp migration và seed 3 sự kiện:

```bash
npm run db:deploy
npm run db:seed
```

Seed dùng `upsert`, vì vậy có thể chạy lại mà không tạo dữ liệu trùng.

Tài khoản dùng để đăng nhập thử sau khi chạy seed:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Sinh viên | `demostudent@gmail.com` | `12345678` |
| Người tổ chức | `demoorganizer@gmail.com` | `12345678` |

Seed cập nhật hai tài khoản demo này nếu đã tồn tại. Tài khoản và các lượt đăng ký/event khác trong database được giữ nguyên.

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

Schema có `User`, `Event`, `Registration` và `Note`. Seed vẫn tạo dữ liệu mẫu, còn app dùng tài khoản riêng đăng ký bằng email/mật khẩu. Mỗi lượt đăng ký và lịch cá nhân gắn với user của bearer session. Organizer cần mã mời cấu hình bằng `ORGANIZER_INVITE_CODE` trong `server/.env`.

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

Trình duyệt sẽ mở `http://localhost:5555`. Có thể xem trực tiếp các bảng `Event`, `User`, `Registration` và `Note`. Sau seed, `Event` có 3 sự kiện mẫu và `User` có tài khoản demo. `Registration` được tạo khi đăng ký qua app.

Prisma Studio và backend có thể chạy đồng thời ở hai terminal khác nhau. Dừng Studio bằng `Ctrl+C` khi không dùng nữa.

## 5. API hiện có

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/events` | Lấy sự kiện đang hiển thị và đã hết hạn; đã hết hạn được đánh dấu, sự kiện organizer ẩn sẽ không hiện |
| GET | `/events?q=tu-khoa` | Tìm sự kiện có tên chứa từ khóa |
| GET | `/events/:id` | Chi tiết công khai và trạng thái đăng ký của tài khoản đang đăng nhập |
| POST | `/events/:id/register` | Đăng ký idempotent; từ chối event đã hết hạn hoặc organizer đã ẩn |
| DELETE | `/events/:id/register` | Hủy nếu chưa check-in; đã check-in trả 409 |
| POST | `/events/:id/check-in` | Xác minh QR, thời gian server và registration rồi ghi nhận `checkedInAt` |
| GET | `/me/registrations` | Lịch của tài khoản đang đăng nhập, kèm event công khai, theo giờ bắt đầu |
| POST | `/auth/register` | Tạo tài khoản sinh viên và session |
| POST | `/auth/register-organizer` | Tạo tài khoản organizer; cần mã mời |
| POST | `/auth/login` | Đăng nhập và nhận bearer session |
| GET | `/auth/me` | Thông tin tài khoản đang đăng nhập |
| PATCH | `/me/profile` | Cập nhật tên và email, role chỉ đọc |
| PATCH | `/me/password` | Đổi mật khẩu, kết thúc các phiên khác |
| GET | `/me/stats` | Thống kê đăng ký, check-in, sự kiện sắp tới và số event đã tạo |
| GET | `/events/:id/note` | Lấy ghi chú và tóm tắt AI của tài khoản đang đăng nhập |
| PUT | `/events/:id/note` | Lưu hoặc cập nhật ghi chú (tối đa 5.000 ký tự) |
| POST | `/events/:id/summarize` | Tóm tắt ghi chú bằng Gemini AI |
| POST | `/organizer/events` | Organizer tạo sự kiện và QR token riêng |
| GET | `/organizer/events` | Danh sách sự kiện do organizer tạo |
| GET | `/organizer/events/:id/stats` | Số đăng ký, check-in, chưa check-in và tỷ lệ tham dự |
| PATCH | `/organizer/events/:id/visibility` | Organizer ẩn/hiện sự kiện của mình |

Bộ lọc tìm kiếm trên trang Khám phá là đầu việc mới giao Khôi, chưa có trong API hiện tại. Dự kiến mở rộng `GET /events` bằng `format`, `from`, `to`, `status` và `registration`.

Chi tiết luồng đăng ký, API response và checklist máy thật: [docs/REGISTRATION_FLOW.md](./docs/REGISTRATION_FLOW.md). Hướng dẫn cấu hình Gemini và API ghi chú: [docs/AI_NOTE_SETUP.md](./docs/AI_NOTE_SETUP.md). POST đăng ký không cần body; DELETE trả `{ data: { registered: false }, error: null }`. API cá nhân và ghi chú yêu cầu bearer token sau khi đăng nhập.

API danh sách và chi tiết không trả `qrToken`; token chỉ được trả cho organizer và hiển thị trong màn quản lý event dưới dạng URL `/check-in?...`. Khi quét bằng app khác, URL mở trang hướng dẫn “Cần sử dụng app Student Event”; khi quét bằng Student Event, app đọc URL và gọi backend. Backend tiếp tục kiểm tra token, bearer session và khung giờ từ 30 phút trước khi bắt đầu đến lúc kết thúc.

Sau khi cập nhật code, áp migration bằng `npm run db:deploy` trong thư mục `server`. Tất cả endpoint đăng ký, chi tiết cá nhân và organizer yêu cầu `Authorization: Bearer <token>` do đăng nhập/đăng ký trả về. App yêu cầu đăng nhập trước khi vào bất kỳ màn hình nào; token được lưu bằng SecureStore trên iOS/Android và `localStorage` trong web/Extension Mobile View, rồi kiểm tra lại với server khi mở app. Cấu hình `ORGANIZER_INVITE_CODE` trong `server/.env` trước khi tạo tài khoản organizer.

API danh sách trả một mảng trong `data`:

```json
{
  "data": [
    {
      "id": "cmhr2n4e30000000000000001",
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

API chi tiết trả một sự kiện và trạng thái đăng ký trong `data` (`registration` là null nếu chưa đăng ký, hoặc `{ id, eventId, createdAt, checkedInAt }`):

```json
{
  "data": {
    "id": "cmhr2n4e30000000000000001",
    "title": "Seminar Công nghệ và AI",
    "description": "...",
    "location": "Phòng B2.02",
    "startsAt": "2026-10-10T06:30:00.000Z",
    "endsAt": "2026-10-10T09:30:00.000Z",
    "registration": null
  },
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
| **Lương Việt Thái** | **Tài khoản, organizer và tích hợp** | Phần khám phá/chi tiết, tài khoản và quản lý sự kiện đã triển khai; hỗ trợ review API và tích hợp luồng chung, không nhận thêm hạng mục tính năng mới |
| **Trần Chí Quốc** | **Đăng ký và lịch cá nhân** | Đăng ký/hủy, lịch cá nhân, sức chứa và hạn đăng ký; phối hợp Đạt để thống nhất trạng thái đăng ký phục vụ check-in |
| **Phạm Tấn Đạt** | **QR và check-in** | Luồng QR cho sự kiện, màn quét và quyền camera, API check-in; xác nhận đăng ký, token, khung giờ và chống check-in lặp |
| **Lê Thanh Kha** | **Ghi chú và AI** | Giữ luồng ghi chú/tóm tắt hiện tại; cùng nhóm hội ý ngày 10/11 về hướng hỏi đáp theo sự kiện rồi mới chốt thay đổi |
| **Chu Anh Khôi** | **Thông báo, modal xác nhận và bộ lọc tìm kiếm** | Nhắc giờ local; modal dùng chung xác nhận thao tác như hủy đăng ký/ẩn sự kiện; bộ lọc ngay trang Khám phá theo hình thức, ngày, trạng thái sự kiện và tình trạng đăng ký |

### Quy tắc làm việc

- Mỗi người sở hữu một luồng chức năng end-to-end, dùng chung API, dữ liệu và danh tính từ phiên đăng nhập.
- Khi thay đổi API hoặc schema, cập nhật hợp đồng liên quan và phối hợp với người phụ trách tính năng phụ thuộc.
- Người phụ trách một tính năng phải bàn giao loading/error/empty, khóa thao tác lặp, test tự động và checklist máy thật; không chỉ bàn giao giao diện chạy happy path.
- Backend và mobile tuân thủ API contract trong specs; không tự tạo dữ liệu giả riêng trên từng màn hình.
- Mỗi nhánh chỉ tập trung một tính năng, ví dụ `feature/qr-check-in` hoặc `feature/ai-notes`.
- Trước khi gửi pull request hoặc merge: chạy typecheck, lint phần mobile, build/test phần server có liên quan và ghi kết quả thật.
- Demo trên lớp chạy trực tiếp bằng Expo Go; không cần APK/EAS hay slide nếu giảng viên không yêu cầu.
- Không merge khi test đang fail. Phần chưa thử trên điện thoại phải ghi `NOT RUN`, không tự đánh dấu pass.
- Thái chịu trách nhiệm tích hợp/review chung và luồng Khám phá → Chi tiết, không mặc định làm thay code, test hoặc tài liệu chưa hoàn thành của thành viên khác.
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
