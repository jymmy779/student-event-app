# Báo cáo kiểm thử Student Event App

## Kết quả ngày 2026-11-12 — Bộ lọc tìm kiếm, ConfirmModal và Local Notifications

Phạm vi Chu Anh Khôi:
- Mở rộng `GET /events` hỗ trợ lọc theo `q`, `format`, `from`, `to`, `status`, `registration`. Trả 400 `INVALID_FILTER` khi giá trị không hợp lệ.
- 10 integration tests mới cho bộ lọc trong `server/tests/events.integration.test.ts`. Sửa chữa đồng bộ session test giúp toàn bộ 44 tests của server pass 100%.
- Filter bar UI trên `explore.tsx` với chip lọc nhanh theo hình thức, trạng thái, tình trạng đăng ký và nút xóa bộ lọc.
- `ConfirmModal` dùng chung cho xác nhận hủy đăng ký sự kiện và ẩn/hiện sự kiện phía Organizer.
- Helper `notifications.ts` (`expo-notifications` + `AsyncStorage`) tự động xin quyền, lên lịch nhắc 30 phút trước sự kiện, hủy lịch khi hủy đăng ký, xử lý từ chối quyền mà không crash app.
- Unit test logic thông báo trong `mobile/src/lib/__tests__/notifications.test.ts`.

Môi trường: Windows 11, Node.js v22.16.0, npm, Expo SDK 58, React Native 0.88.1, Prisma 6, Vitest 4.1.11.

| Khu vực | Lệnh đã chạy | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Server typecheck | `npm run typecheck` (server) | PASS | 0 lỗi TypeScript |
| Server build | `npm run build` (server) | PASS | `dist/` compile thành công |
| Server integration | `npm test` (server) | PASS | 3 files, **44 passed (44/44)**, 0 failed, 0 skipped |
| Mobile typecheck | `npx tsc --noEmit` (mobile) | PASS | 0 lỗi TypeScript (bao gồm test types) |
| Mobile lint | `npm run lint` (mobile) | PASS | 0 errors (7 warnings không chặn) |
| Mobile web export | `npx expo export --platform web` | PASS | 18 static routes bundle thành công vào `dist/` |
| Expo Go máy thật (Thông báo) | Chưa thực hiện trên thiết bị thật | NOT RUN | Cần điện thoại Android/iOS thật quét QR Expo Go |

### Checklist kiểm thử máy thật (Thông báo local & Bộ lọc):
1. **Bộ lọc Khám phá**:
   - Mở tab Khám phá: bấm chọn chip "Trực tiếp" -> chỉ hiện event IN_PERSON.
   - Bấm chọn tiếp "Sắp diễn ra" -> chỉ hiện event IN_PERSON sắp diễn ra.
   - Bấm nút "Xóa bộ lọc" -> danh sách quay về mặc định.
   - Nhập từ khóa kết hợp chọn bộ lọc: kiểm tra khi không có kết quả, màn hình hiện EmptyState thông báo rõ ràng.
2. **ConfirmModal**:
   - Vào chi tiết một sự kiện đã đăng ký -> bấm "Hủy đăng ký": modal xuất hiện với 2 nút "Xác nhận hủy" (màu đỏ) và "Giữ đăng ký".
   - Bấm "Giữ đăng ký": modal đóng, trạng thái đăng ký giữ nguyên.
   - Bấm "Xác nhận hủy": nút hiện loading spinner, sau khi hoàn tất trạng thái chuyển về "Chưa đăng ký".
   - Vào tab Quản lý sự kiện (tài khoản Organizer) -> bấm nút "Ẩn"/"Hiện" trên một sự kiện: modal xác nhận xuất hiện trước khi áp dụng thay đổi.
3. **Local Notification nhắc giờ**:
   - Mở app lần đầu, đăng ký 1 sự kiện tương lai (>30 phút): hệ điều hành hiện popup xin quyền thông báo.
   - Nếu từ chối quyền: app không bị crash, đăng ký vẫn thành công, xuất hiện dòng nhắc màu cam: "Chưa bật thông báo — bật trong Cài đặt để nhận nhắc giờ sự kiện."
   - Nếu cấp quyền: thông báo được lên lịch trước 30 phút giờ bắt đầu sự kiện.
   - Hủy đăng ký sự kiện: thông báo đã lên lịch tự động bị hủy khỏi hàng đợi của hệ thống.

PR của Kha ghi nhận 14 test Note/AI trong tổng 20 integration test, cùng các trường hợp lưu/đọc ghi chú, giới hạn nội dung, cô lập dữ liệu theo user, lỗi Gemini và timeout. Báo cáo gốc cũng ghi nhận typecheck/build server, typecheck/lint/export mobile và một lần gọi Gemini thật đạt.

Các kết quả trên được ghi nhận trước khi đổi cơ chế định danh từ `x-user-id`/demo user sang bearer session. Test đã được cập nhật để dùng session; cần chạy lại bộ kiểm thử sau khi tích hợp trước khi coi các kết quả này là đã xác nhận trên nhánh hợp nhất.

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
| Seed idempotent | Seed hai lần trong integration test | PASS: giữ registration, các tài khoản mẫu và 3 event mẫu |
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
