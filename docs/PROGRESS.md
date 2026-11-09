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
| Lương Việt Thái | Khám phá/tìm kiếm/chi tiết; tài khoản và hồ sơ; quyền organizer; tạo/sửa/ẩn event, sức chứa, hạn đăng ký, hình thức, thống kê; layout và tích hợp chung | `Thai` | `ĐANG LÀM — CHỜ KIỂM TRA` | Hợp đồng API, migration và tích hợp với registration/QR |
| Trần Chí Quốc | Đăng ký/hủy đăng ký, lịch cá nhân, component đăng ký và persistence | `feature/quoc-registration-schedule` | `CẦN TÍCH HỢP VÀ KIỂM TRA` | Session user, hạn đăng ký/sức chứa và QR/check-in |
| Phạm Tấn Đạt | Camera, QR token, check-in và API check-in | `Dat` | `ĐANG LÀM` | Registration, session user và event ownership |
| Lê Thanh Kha | Ghi chú, tóm tắt AI và xử lý lỗi AI | `kha` | `ĐANG LÀM` | Session user, Event và cấu hình dịch vụ AI |
| Chu Anh Khôi | Notification, công cụ QR demo, UI polish và build phát hành | `Khoi` | `ĐANG LÀM` | Đăng ký/hủy, QR token và các luồng đã tích hợp |

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
- Ảnh, video, log hoặc dữ liệu mẫu dùng để chứng minh.
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
| Lương Việt Thái | Khám phá/tìm kiếm/chi tiết; đăng nhập, đăng ký, session và hồ sơ; quyền organizer; tạo/sửa/ẩn sự kiện, sức chứa, hạn đăng ký, hình thức, thống kê; layout và tài liệu tích hợp | Đã triển khai trong workspace; chưa chạy typecheck/test hoặc xác nhận trên điện thoại trong phiên này | Rà soát contract và migration cùng nhóm; bàn giao identity/session cho Quốc, Đạt và Kha |
| Trần Chí Quốc | Đăng ký/hủy đăng ký, lịch cá nhân và component thao tác đăng ký | Phần nền đã có; cần tích hợp với xác thực theo tài khoản và chính sách hạn đăng ký/sức chứa mới | Dùng `request.user.id` làm user hiện tại; phối hợp Đạt để QR/check-in dùng cùng registration; chạy lại integration tests và xác nhận trên máy thật |
| Phạm Tấn Đạt | QR token, camera và check-in | Theo phạm vi phân công; chưa xác nhận tích hợp với session mới | Phối hợp Quốc về registration/check-in và Thái về quyền organizer, event ownership |
| Lê Thanh Kha | Ghi chú, tóm tắt AI và xử lý lỗi AI | Theo phạm vi phân công; cần kiểm tra tương thích với xác thực tài khoản | Lấy user từ session; phối hợp Thái về API và quyền truy cập |
| Chu Anh Khôi | Notification, công cụ QR demo, UI polish và build phát hành | Theo phạm vi phân công; chưa xác nhận tích hợp | Kiểm tra luồng sau đăng nhập và phối hợp Đạt về QR/check-in |

### Tài khoản demo

`npm run db:seed` tạo/cập nhật `demostudent@gmail.com` và `demoorganizer@gmail.com`, cả hai dùng mật khẩu `12345678`. Seed giữ nguyên các tài khoản khác, sự kiện và lượt đăng ký. Không xóa database hoặc migration để chuẩn bị cho thành viên tiếp tục làm việc.

### Trạng thái nhánh

Phần tài khoản và organizer của Thái đã được merge vào `main` qua PR #4. Nhánh `kha` đang tích hợp `main` mới để chuyển ghi chú sang bearer session; chưa push bản tích hợp này.

## Tích hợp ghi chú và tóm tắt AI của Kha — 2026-11-09

Đã ghép route và màn hình ghi chú AI vào luồng đăng nhập hiện tại. API ghi chú dùng `request.user.id` từ bearer session, không nhận `x-user-id` và không tự tạo user giả. Đã cập nhật client/API types, cấu hình `GEMINI_API_KEY`, hướng dẫn và test để tạo session khi kiểm tra quyền sở hữu. Chưa chạy test/typecheck hoặc kiểm thử trên điện thoại sau tích hợp; cần xác nhận lại cả note API và đăng nhập.
