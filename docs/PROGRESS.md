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
| Lương Việt Thái | Khám phá, tìm kiếm, chi tiết sự kiện, navigation, API client và tích hợp chung | `Thai` | `HOÀN THÀNH` | Hợp đồng API dùng chung |
| Trần Chí Quốc | Đăng ký, hủy đăng ký, lịch cá nhân, demo user và persistence | `feature/registration-schedule` | `CHƯA BẮT ĐẦU` | Chi tiết sự kiện và demo user |
| Phạm Tấn Đạt | Camera, QR token, check-in và API check-in | `feature/qr-check-in` | `CHƯA BẮT ĐẦU` | Registration và quy ước QR token |
| Lê Thanh Kha | Ghi chú, tóm tắt AI và xử lý lỗi AI | `feature/ai-notes` | `CHƯA BẮT ĐẦU` | Demo user, Event và cấu hình dịch vụ AI |
| Chu Anh Khôi | Notification, công cụ QR demo, UI polish và build phát hành | `feature/notifications-release` | `CHƯA BẮT ĐẦU` | Đăng ký/hủy, QR token và các luồng đã tích hợp |

## Quan hệ phụ thuộc

1. Thái chốt route chi tiết sự kiện, API client, kiểu dữ liệu và định dạng lỗi dùng chung.
2. Quốc chốt demo user và luồng đăng ký/hủy trước khi Đạt và Khôi tích hợp.
3. Đạt thống nhất cấu trúc QR token với Khôi trước khi làm công cụ tạo QR demo.
4. Kha có thể làm song song sau khi chốt `userId`, `eventId` và hợp đồng API.
5. Khôi chỉ bắt đầu build phát hành sau khi các luồng chính đã merge và kiểm thử tích hợp.

## Checklist tích hợp chung

- [ ] Chốt demo user và cách xác định current user.
- [ ] Chốt API contract và error code trong spec.
- [ ] Mỗi tính năng có loading, error và empty state phù hợp.
- [ ] Khóa thao tác lặp đối với đăng ký, hủy, check-in và gửi yêu cầu AI.
- [ ] Không tạo mock data riêng trong từng màn hình.
- [ ] Backend typecheck, build và test đều đạt.
- [ ] Mobile typecheck và lint đều đạt.
- [ ] Kiểm thử các luồng quan trọng trên thiết bị thật.
- [ ] Ghi lại ảnh, video hoặc log làm bằng chứng.
- [ ] Cập nhật README, spec và tài liệu API khi contract thay đổi.

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
