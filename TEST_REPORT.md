# Báo cáo kiểm thử Student Event App

## Kết quả ngày 2026-11-05 — Đăng ký và lịch cá nhân

Phạm vi Trần Chí Quốc: API đăng ký/hủy/lịch, demo user, component dùng chung trên chi tiết và tab Lịch, persistence. Không triển khai QR, notification hoặc AI trong lần bàn giao này. Chưa tạo commit.

Môi trường: Windows, Node.js v22.16.0; Expo ~57.0.25, React Native 0.86.3, Prisma 6, Vitest 4.1.11. Backend dùng SQLite test tại thư mục tạm, áp migration 20260925000000_init thật. Integration tests không sửa DB demo.

| Khu vực | Lệnh đã chạy | Kết quả |
| --- | --- | --- |
| Mobile typecheck | `npx tsc --noEmit` | PASS |
| Mobile lint | `npm run lint` | PASS, không warning sau khi sửa callback làm mới lịch |
| Server typecheck | `npm run typecheck` | PASS |
| Server build | `npm run build` | PASS |
| Server integration | `npm test` | PASS: 2 file, 20 test, 0 fail, 0 skip |
| Seed idempotent | Seed hai lần trong integration test | PASS: giữ registration, 1 demo user, 3 event mẫu |
| Persistence | Ngắt Prisma client, đọc từ client mới, API kết nối lại | PASS trên SQLite test |
| Máy thật / Expo Go | Chưa thực hiện | NOT RUN — cần thiết bị Android/iOS |
| Restart tiến trình app/server với UI | Chưa thực hiện | NOT RUN — test tự động mới kiểm tra persistence qua kết nối DB độc lập |
| APK / EAS Build | Chưa thực hiện | NOT RUN — ngoài phạm vi đăng ký/lịch |

14 integration test mới trong `server/tests/registrations.integration.test.ts` kiểm tra: đăng ký và trạng thái trên detail/lịch; đăng ký lặp giữ ID và checkedInAt; 5 request đồng thời không trùng; DB unique constraint; hủy và đăng ký lại; hủy lặp; chặn hủy sau check-in và giữ bản ghi; sự kiện không tồn tại; lịch rỗng; không giả danh hoặc đọc/xóa lịch người khác; sắp xếp theo thời gian; persistence; thiếu demo user; seed idempotent. 6 test sự kiện cũ đều tiếp tục đạt.

Đã giữ nguyên schema Registration và migration vì baseline có đủ khóa ngoại, checkedInAt và unique(userId,eventId). API hủy dùng điều kiện checkedInAt=null ngay trong câu DELETE. Thử chặn hủy bằng cách đặt checkedInAt trực tiếp trong DB test; chưa coi đó là bằng chứng luồng QR hoạt động.

Checklist kiểm thử máy thật và hợp đồng tích hợp: [docs/REGISTRATION_FLOW.md](./docs/REGISTRATION_FLOW.md). Cần xác nhận đăng ký/hủy đồng bộ giữa hai màn hình, mở lại app/restart server vẫn giữ lịch, UI check-in, mạng lỗi/retry và thao tác xác nhận hủy. Tất cả thiết bị hiện dùng chung demo user; chưa có đăng nhập riêng.

## Lịch sử kiểm thử

## Kết quả ngày 2026-10-26

Phạm vi kiểm thử gồm danh sách, tìm kiếm, chi tiết sự kiện, điều hướng và safe area.

| Khu vực | Lệnh hoặc môi trường | Kết quả |
| --- | --- | --- |
| Server typecheck | `npm run typecheck` | PASS |
| Server build | `npm run build` | PASS |
| Server integration test | `npm test` | PASS - 1 file, 6 test |
| Mobile typecheck | `npx tsc --noEmit` | PASS |
| Mobile lint | `npm run lint` | PASS |
| Mobile trên điện thoại | Expo Go | PASS - người dùng xác nhận |

## Trường hợp backend đã kiểm tra

- `GET /events` trả dữ liệu thật từ SQLite theo API envelope.
- Danh sách rỗng trả mảng rỗng.
- Tìm kiếm sự kiện theo tiêu đề.
- Danh sách không làm lộ `qrToken`.
- `GET /events/:id` trả chi tiết sự kiện tồn tại và không làm lộ `qrToken`.
- ID không tồn tại trả `404` với mã `EVENT_NOT_FOUND`.

## Phạm vi chưa kiểm tra

- Trạng thái, đăng ký, hủy đăng ký và lịch cá nhân chưa được triển khai.
- Camera, QR check-in, notification và AI chưa nằm trong mốc hiện tại.
- Chưa có kết quả build APK; lần kiểm tra thiết bị hiện dùng Expo Go.
