# Đăng ký và lịch cá nhân — Trần Chí Quốc

> **Cập nhật tích hợp 2026-11-09:** phần demo identity bên dưới là lịch sử của MVP ban đầu. Luồng hiện tại dùng bearer session và tài khoản cá nhân. Chạy `npm run db:deploy`; đăng nhập tại mobile để gọi endpoint chi tiết, đăng ký, hủy và `/me/registrations`. Organizer tạo tài khoản bằng mã `ORGANIZER_INVITE_CODE`. Các lượt đăng ký cũ vẫn gắn với user `demo-student`, không tự chuyển sang tài khoản vừa tạo.

> **Trạng thái event:** event đã qua `endsAt` vẫn được giữ, tìm kiếm được và hiển thị badge “Đã hết hạn”; API từ chối đăng ký mới bằng `409 EVENT_ENDED`. Chỉ event mà organizer chủ động ẩn (`isHidden`) mới biến khỏi Khám phá/tìm kiếm. Bản ghi cũ và thống kê không bị xóa.

## Phạm vi

Luồng: Khám phá → Chi tiết → Đăng ký tham gia → Lịch của tôi → Chi tiết hoặc Hủy đăng ký. Hai màn hình dùng chung `mobile/src/components/RegistrationActions.tsx`. Nút bị khóa khi gửi yêu cầu; hủy cần xác nhận và chỉ cập nhật UI sau khi API thành công. Các màn hình tải lại khi được focus; tab Lịch hỗ trợ kéo làm mới, loading/error/retry và empty state.

Không có dữ liệu lịch giả hoặc lịch chỉ lưu trong state. Dữ liệu nằm trong SQLite của backend; mở lại app tải cùng lịch từ API. Khi mất mạng, UI hiển thị lỗi và giữ trạng thái đăng ký đang có. Nếu thiết bị khác đã check-in, lỗi hủy được hiển thị và component tải lại trạng thái từ server.

## Danh tính demo và schema

Chạy tại `server/`:

```sh
npm run db:deploy
npm run db:seed
npm run dev
```

Seed tạo user `demo-student`, tên `Sinh viên demo`, email `demo@student-events.local` bằng upsert. Seed chạy lại không xóa registration, không tạo trùng demo user. `server/src/demo-user.ts` cung cấp định danh dùng chung cho các tính năng tiếp theo.

Server luôn chọn user demo cố định, bỏ qua `userId` trong body, query và header. Đây là chế độ demo dùng chung giữa các thiết bị, chưa phải đăng nhập hay phân quyền tài khoản sản xuất. Nếu chưa seed user, API cá nhân trả 503 `DEMO_USER_NOT_CONFIGURED`. Chi tiết sự kiện vẫn đọc công khai được.

Schema `Registration` và migration ban đầu đã có đủ: `id`, `userId`, `eventId`, `createdAt`, `checkedInAt?`, khóa ngoại tới User/Event, `@@unique([userId, eventId])`. Giữ nguyên schema, không cần migration mới. Không thêm SQLite trên điện thoại: SQLite chung đã nằm ở server theo spec.

## Hợp đồng API

Tất cả trả `{ data, error }`. Đăng ký thành công dùng HTTP 200 cho cả lần đầu và retry.

| Method | Endpoint | `data` khi thành công |
| --- | --- | --- |
| GET | `/events/:id` | Event công khai và `registration: Registration hoặc null` |
| POST | `/events/:id/register` | `{ id, eventId, createdAt, checkedInAt }` |
| DELETE | `/events/:id/register` | `{ registered: false }` |
| GET | `/me/registrations` | Mảng `{ id, eventId, createdAt, checkedInAt, event }`, tăng dần theo `event.startsAt` |

`event` chỉ gồm các trường công khai hiện có; không trả `qrToken`, password hay quan hệ User. Thời gian JSON dạng ISO UTC, app hiển thị giờ Việt Nam.

| HTTP | Code | Trường hợp |
| --- | --- | --- |
| 404 | `EVENT_NOT_FOUND` | Đăng ký/hủy sự kiện không tồn tại |
| 409 | `ALREADY_CHECKED_IN` | Hủy registration đã check-in |
| 503 | `DEMO_USER_NOT_CONFIGURED` | Chưa seed demo user |

POST dùng upsert và unique constraint để không tạo trùng, bảo toàn ID, createdAt, checkedInAt khi retry. DELETE chưa đăng ký hoặc hủy lặp trả thành công. Điều kiện `checkedInAt: null` nằm ngay trong câu lệnh xóa để không xóa bản ghi đã check-in giữa lúc đọc và ghi.

Theo hợp đồng MVP hiện tại, không thêm giới hạn đăng ký theo thời gian sự kiện; sự kiện kết thúc vẫn hiển thị trong lịch với nhãn Đã kết thúc. Nhãn Đã check-in được ưu tiên; còn lại là Sắp diễn ra / Đang diễn ra / Đã kết thúc theo thời gian thiết bị lúc render hoặc làm mới.

## Điểm nối cho các thành viên

- QR check-in: dùng cùng demo identity, chỉ cập nhật `checkedInAt` khi registration tồn tại; xử lý trường hợp registration bị hủy trước khi check-in. Chưa triển khai endpoint check-in trong phần việc này.
- Notification: nối thao tác lên/hủy nhắc giờ sau API đăng ký/hủy thành công; phần việc này chưa xin quyền hoặc tạo notification.
- Ghi chú/AI: có thể dùng cùng demo identity; API registration không nhận userId tùy ý.

## Kiểm thử

Từ `server/`: `npm test`, `npm run typecheck`, `npm run build`. Từ `mobile/`: `npx tsc --noEmit`, `npm run lint`.

14 test registration mới dùng SQLite test riêng, migration thật: đăng ký và đồng bộ detail/lịch; retry bảo toàn trạng thái check-in; 5 request đăng ký đồng thời; unique constraint; hủy và đăng ký lại; hủy lặp; chặn hủy sau check-in; sự kiện thiếu; lịch rỗng; không giả danh/đọc/xóa lịch người khác; sắp xếp; persistence qua kết nối DB mới; thiếu demo user; seed chạy hai lần giữ nguyên registration. Cộng 6 test sự kiện hiện có thành 20 test.

Test persistence ngắt các Prisma client và dùng client độc lập để đọc DB, rồi API kết nối lại. Chưa tự động hóa việc tắt/mở tiến trình Expo trên máy thật.

Checklist máy thật (chưa chạy trong phiên triển khai):

1. Seed và chạy server, cấu hình `EXPO_PUBLIC_API_URL` theo IP LAN, mở Expo Go.
2. Từ Khám phá mở sự kiện → Đăng ký tham gia; thấy Đã đăng ký và sự kiện trong Lịch.
3. Tắt/mở app và restart server; lịch và trạng thái detail vẫn còn.
4. Hủy từ detail hoặc Lịch → xác nhận; cả hai màn phản ánh chưa đăng ký. Chọn Giữ đăng ký phải giữ lịch.
5. Nhờ luồng QR cập nhật checkedInAt (hoặc đặt giá trị bằng Prisma Studio trên DB demo); UI hiển thị Đã check-in và không có nút hủy.
6. Tắt backend/mạng; thử lại sau khi bật mạng. Kiểm tra loading, lỗi, retry và lịch rỗng trên Android/iOS.

Không cần và không tạo endpoint sửa checkedInAt công khai chỉ để thử demo.
