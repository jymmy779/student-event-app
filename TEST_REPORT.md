# Báo cáo kiểm thử Student Event App

## Kết quả ngày 2026-11-01 (Mốc 3: Ghi chú và tóm tắt AI - Lê Thanh Kha)

Phạm vi kiểm thử gồm: Quản lý ghi chú (lưu, đọc, validation), tích hợp Google Gemini AI tóm tắt thông minh, xử lý lỗi và timeout, kiểm tra quyền sở hữu đa người dùng, giao diện mobile màn hình ghi chú.

| Khu vực | Lệnh hoặc môi trường | Kết quả |
| --- | --- | --- |
| Server typecheck | `npm run typecheck` | PASS |
| Server build | `npm run build` | PASS |
| Server integration test | `npm test` | PASS - 2 files, 20 tests (14 tests Note/AI mới) |
| Server live AI verification | Gọi API thật với Google Gemini | PASS - Trả về tóm tắt tiếng Việt chính xác |
| Mobile typecheck | `npx tsc --noEmit` | PASS |
| Mobile lint | `npm run lint` | PASS - 0 errors, 0 warnings |
| Mobile export | `npx expo export --platform web` | PASS - 9 routes exported |

### Trường hợp Note & AI đã kiểm tra tự động

- `GET /events/:id/note`:
  - Trả về `404 EVENT_NOT_FOUND` nếu mã sự kiện không tồn tại.
  - Trả về `data: null` nếu người dùng chưa tạo ghi chú cho sự kiện.
  - Trả về đầy đủ bản ghi ghi chú nếu đã tồn tại.
- `PUT /events/:id/note`:
  - Chặn ghi chú rỗng hoặc toàn khoảng trắng (`400 NOTE_EMPTY`).
  - Chặn ghi chú vượt quá 5.000 ký tự (`400 NOTE_TOO_LONG`).
  - Trả về `404 EVENT_NOT_FOUND` nếu mã sự kiện không hợp lệ.
  - Lưu ghi chú hợp lệ và tạo dữ liệu thật trong SQLite.
  - Cập nhật đúng khi gọi lại (idempotent upsert).
- Quyền sở hữu dữ liệu (Ownership Isolation):
  - Ghi chú của User 1 và User 2 trên cùng một sự kiện hoàn toàn tách biệt.
  - User 2 không đọc hoặc ghi đè được ghi chú của User 1.
- `POST /events/:id/summarize`:
  - Chặn tóm tắt khi chưa có ghi chú (`400 NOTE_EMPTY`).
  - Trả về `503 AI_SERVICE_UNAVAILABLE` rõ ràng khi máy chủ chưa cấu hình `GEMINI_API_KEY`.
  - Gọi AI thành công: Cập nhật trường `summary` trong DB và trả về bản ghi cập nhật.
  - Xử lý timeout (`504 AI_TIMEOUT`): Bảo toàn nguyên vẹn nội dung ghi chú trong DB.
  - Xử lý lỗi dịch vụ AI (`503 AI_SERVICE_ERROR`): Bảo toàn nội dung ghi chú trong DB.

---

## Kết quả ngày 2026-10-26 (Mốc baseline: Khám phá và chi tiết sự kiện - Lương Việt Thái)

Phạm vi kiểm thử gồm danh sách, tìm kiếm, chi tiết sự kiện, điều hướng và safe area.

| Khu vực | Lệnh hoặc môi trường | Kết quả |
| --- | --- | --- |
| Server typecheck | `npm run typecheck` | PASS |
| Server build | `npm run build` | PASS |
| Server integration test | `npm test` | PASS - 1 file, 6 test |
| Mobile typecheck | `npx tsc --noEmit` | PASS |
| Mobile lint | `npm run lint` | PASS |
| Mobile trên điện thoại | Expo Go | PASS - người dùng xác nhận |

---

## Phạm vi còn lại của dự án

- Trạng thái đăng ký, hủy đăng ký và lịch cá nhân (Trần Chí Quốc - `feature/registration-schedule`).
- Camera, quét mã QR và check-in (Phạm Tấn Đạt - `feature/qr-check-in`).
- Thông báo local nhắc giờ, công cụ tạo QR demo và build release APK (Chu Anh Khôi - `feature/notifications-release`).
