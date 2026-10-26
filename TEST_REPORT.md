# Báo cáo kiểm thử Student Event App

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
