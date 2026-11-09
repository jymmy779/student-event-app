# Tiến độ dự án Student Event App

Tài liệu này ghi nhận trạng thái triển khai thực tế của nhóm, các phụ thuộc giữa tính năng và bằng chứng kiểm thử. Phân công trong đây là phân công hiện hành; đơn đăng ký đề tài tuần đầu chỉ thể hiện kế hoạch sơ bộ.

## Quy ước trạng thái

| Trạng thái | Ý nghĩa |
| --- | --- |
| `CHƯA BẮT ĐẦU` | Chưa có code hoặc bằng chứng triển khai |
| `ĐANG LÀM` | Đang triển khai trên branch cá nhân |
| `CHỜ TÍCH HỢP` | Đã làm xong phần riêng nhưng còn phụ thuộc tính năng khác |
| `CHỜ KIỂM THỬ MÁY THẬT` | Đã qua kiểm tra tự động nhưng chưa xác nhận trên thiết bị |
| `HOÀN THÀNH` | Đã tích hợp, kiểm thử và có bằng chứng |
| `BỊ CHẶN` | Không thể tiếp tục do một phụ thuộc chưa được giải quyết |

Không đánh dấu `HOÀN THÀNH` khi test đang lỗi. Phần chưa chạy trên điện thoại phải ghi `CHƯA KIỂM THỬ`, không suy đoán là đạt.

## Phân công hiện hành

| Thành viên | Phạm vi sở hữu | Branch đề xuất | Trạng thái | Phụ thuộc chính |
| --- | --- | --- | --- | --- |
| Lương Việt Thái | Tài khoản/hồ sơ, organizer và tích hợp luồng chung (đã triển khai) | `Thai` | `HỖ TRỢ REVIEW/TÍCH HỢP` | API dùng chung, migration và xác nhận luồng trên Expo Go |
| Trần Chí Quốc | Đăng ký/hủy và lịch cá nhân | `feature/quoc-registration-schedule` | `ĐÃ CÓ PHẦN NỀN — TIẾP TỤC TÍCH HỢP` | Session user; phối hợp Đạt về check-in |
| Phạm Tấn Đạt | QR và check-in trọn luồng | `Dat` | `ĐANG LÀM` | Registration/session của Quốc |
| Lê Thanh Kha | Ghi chú/tóm tắt AI hiện tại; xem xét hướng hỏi đáp sau khi nhóm hội ý | `kha` | `GIỮ HIỆN TRẠNG — CHỜ HỘI Ý 10/11` | Gemini key và thống nhất phạm vi với nhóm |
| Chu Anh Khôi | Thông báo local, modal xác nhận (ví dụ hủy đăng ký/ẩn event) và bộ lọc trang Khám phá | `Khoi` | `ĐƯỢC GIAO — CHƯA TRIỂN KHAI` | Hình thức/ngày/trạng thái event; phối hợp Quốc về tình trạng đăng ký |

## Bảng cập nhật của thành viên

Mỗi thành viên cập nhật một dòng khi bắt đầu hoặc hoàn thành một phần việc.

| Ngày | Thành viên | Việc thực hiện | Kết quả | Test và bằng chứng | Vướng mắc | Bước tiếp theo |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-25 | Lương Việt Thái | Thiết lập baseline khám phá và tìm kiếm sự kiện | Có danh sách, tìm kiếm và API `GET /events?q=` | Commit `586b468`; cần đối chiếu lại test hiện hành | Chưa có các API tính năng còn lại | Hoàn thiện tích hợp và bàn giao contract |
| 2026-10-26 | Lương Việt Thái | Chuẩn hóa safe area cho các tab hiện tại | `explore` và `schedule` dùng `SafeAreaView`; root có `SafeAreaProvider` | `npx tsc --noEmit`: đạt; `npm run lint`: đạt; Expo Go trên điện thoại: đạt | Không có | Bàn giao và tích hợp |
| 2026-10-26 | Lương Việt Thái | Hoàn thiện luồng danh sách đến chi tiết sự kiện | Có route `/events/[id]`, API `GET /events/:id`, loading/error/retry và không lộ `qrToken` | Server typecheck/build: đạt; 6/6 integration tests đạt; mobile typecheck/lint: đạt; Expo Go trên điện thoại: đạt | Trạng thái đăng ký thuộc luồng của Quốc | Bàn giao điểm tích hợp đăng ký |

## Mẫu nhật ký mới

Sao chép dòng dưới đây và điền đủ thông tin. Không xóa các dòng lịch sử của thành viên khác.

```text
| YYYY-MM-DD | Họ tên | Việc đã làm | Kết quả cụ thể | Lệnh test và đường dẫn bằng chứng | Không có hoặc mô tả blocker | Việc tiếp theo |
```

## Checklist bàn giao tính năng

Mỗi pull request cần ghi:

- Phạm vi đã hoàn thành và phần cố ý chưa làm.
- File, migration hoặc API contract đã thêm hay thay đổi.
- Các lệnh kiểm thử đã chạy cùng kết quả thật.
- Trạng thái kiểm thử trên thiết bị thật.
- Kết quả kiểm tra thực tế và dữ liệu mẫu cần để tái hiện chức năng.
- Phụ thuộc hoặc lưu ý dành cho người tích hợp.

## Quy tắc cập nhật tài liệu

- Cập nhật nhật ký trong cùng pull request với code liên quan.
- Một thay đổi API hoặc schema phải cập nhật README/spec/test tương ứng.
- Khi công việc bị chặn, ghi rõ người hoặc contract cần phối hợp; không chỉ ghi “đang chờ”.
- Thái tổng hợp trạng thái chung nhưng mỗi thành viên tự chịu trách nhiệm về nội dung và bằng chứng của phần mình.

## Cập nhật đăng ký và lịch cá nhân — 2026-11-05

| Ngày | Thành viên | Việc thực hiện | Kết quả | Test và bằng chứng | Vướng mắc | Bước tiếp theo |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-05 | Trần Chí Quốc | Component đăng ký/hủy, tab Lịch, API cá nhân, demo user và persistence | Lưu SQLite; chống trùng; chặn hủy sau check-in | 20/20 integration test; chi tiết tại TEST_REPORT.md và docs/REGISTRATION_FLOW.md | Chưa xác nhận trên máy thật | Demo đăng ký/hủy và restart app; bàn giao điểm nối QR/notification |

## Tích hợp tài khoản và organizer — 2026-11-09

| Thành viên | Phần bổ sung | Kết quả hiện tại | Kiểm tra | Còn lại |
| --- | --- | --- | --- | --- |
| Lương Việt Thái | Tài khoản cá nhân, API session, luồng đăng nhập mobile, quyền organizer, tạo event và thống kê tham dự | Đã thêm migration/schema, API và màn hình; organizer được giới hạn theo mã mời và chỉ xem event mình tạo | Chưa chạy typecheck/test và chưa kiểm thử trên điện thoại trong phiên cập nhật này | Thành viên áp migration bằng `npm run db:deploy`; Quốc/Đạt tích hợp QR/check-in với identity/session mới; bổ sung bằng chứng test |

### Chuẩn hóa ID mẫu — 2026-11-09

Seed dùng ID do Prisma sinh; upsert dữ liệu event theo `qrToken`, user theo `email`. Migration chuyển khóa chính cũ có tiền tố `event-`/`demo-` sang ID dạng CUID và dựa vào foreign key `ON UPDATE CASCADE` để giữ liên kết. Các migration đều đã được ghi nhận là hoàn tất trong database local `server/prisma/dev.db`; mỗi thành viên cần chạy `npm run db:deploy` trên database của mình. Không xóa migration hoặc database dùng chung.

### Hoàn thiện Hồ sơ — 2026-11-09

Đã thêm API sửa tên/email, đổi mật khẩu có xác minh mật khẩu hiện tại (thu hồi các session khác), thống kê cá nhân; UI Hồ sơ có vai trò chỉ đọc, form chỉnh sửa, đổi mật khẩu, thống kê, hướng dẫn, hỗ trợ và đăng xuất. Chưa chạy typecheck/test hoặc xác nhận trên thiết bị.

## Phân công và bàn giao cập nhật — 2026-11-09

Bảng này thay thế bảng phân công hiện hành ở đầu file sau khi tích hợp nhánh. Các trạng thái test bên dưới chỉ ghi nhận việc đã kiểm tra thực tế; không xem code chưa chạy kiểm tra là hoàn thành.

| Thành viên | Phạm vi hiện tại | Tình trạng | Phối hợp / bước tiếp theo |
| --- | --- | --- | --- |
| Lương Việt Thái | Tài khoản/hồ sơ, organizer và tích hợp luồng chung | Phần chính đã triển khai; hỗ trợ review/tích hợp | Hỗ trợ các thành viên theo API/schema, không nhận đầu việc tính năng mới |
| Trần Chí Quốc | Đăng ký/hủy đăng ký và lịch cá nhân | Phần nền đã có; cần xác nhận sau cập nhật auth/session | Dùng cùng registration/session với Đạt; phối hợp Khôi về trạng thái lọc đăng ký |
| Phạm Tấn Đạt | QR và check-in trọn luồng | Đang triển khai | Nối QR với registration, session và thời gian sự kiện |
| Lê Thanh Kha | Ghi chú và tóm tắt AI hiện tại | Đã tích hợp; giữ hiện trạng đến buổi hội ý ngày 10/11 | Sau hội ý mới chốt có đổi AI sang hỏi đáp sự kiện hay không |
| Chu Anh Khôi | Thông báo local, modal xác nhận (ví dụ hủy đăng ký/ẩn event) và bộ lọc trang Khám phá | Đầu việc mới; chưa triển khai | Phối hợp Quốc về tình trạng đăng ký; làm modal xác nhận dùng chung |

### Tài khoản demo

`npm run db:seed` tạo/cập nhật `demostudent@gmail.com` và `demoorganizer@gmail.com`, cả hai dùng mật khẩu `12345678`. Seed giữ nguyên các tài khoản khác, sự kiện và lượt đăng ký. Không xóa database hoặc migration để chuẩn bị cho thành viên tiếp tục làm việc.

### Trạng thái nhánh

Phần tài khoản/organizer của Thái đã được merge qua PR #4; phần ghi chú/tóm tắt AI của Kha đã được merge qua PR #3 và dùng bearer session.

## Tích hợp ghi chú và tóm tắt AI của Kha — 2026-11-09

Đã ghép route và màn hình ghi chú AI vào luồng đăng nhập hiện tại. API ghi chú dùng `request.user.id` từ bearer session, không nhận `x-user-id` và không tự tạo user giả. Đã cập nhật client/API types, cấu hình `GEMINI_API_KEY`, hướng dẫn và test để tạo session khi kiểm tra quyền sở hữu. Chưa chạy test/typecheck hoặc kiểm thử trên điện thoại sau tích hợp; cần xác nhận lại cả note API và đăng nhập.

## Điều chỉnh phân công — 2026-11-09

- Khôi nhận bộ lọc ngay trang Khám phá (hình thức, khoảng ngày, trạng thái sự kiện và tình trạng đăng ký), modal xác nhận thao tác và thông báo local.
- Đạt phụ trách QR và check-in trọn luồng; Quốc tiếp tục đăng ký/hủy và lịch cá nhân.

- Thái đã làm phần tài khoản/organizer; từ đây hỗ trợ tích hợp và review
