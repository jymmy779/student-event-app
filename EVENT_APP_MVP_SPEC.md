# Specs MVP ứng dụng Đồng hành sự kiện sinh viên

Nguồn: Đơn đăng ký đề tài bài tập lớn Nhóm 15, học phần Lập trình thiết bị di động (2101454). Đây là bản chốt phạm vi đề xuất để hoàn thành một sản phẩm chạy và demo được sớm. Đơn đăng ký mới mô tả ý tưởng sơ bộ, chưa có rubric, deadline, yêu cầu công nghệ hay tiêu chí chấm chi tiết; cần đối chiếu lại khi có đề chính thức.

## 1. Mục tiêu bản đầu

Một sinh viên có thể xem sự kiện, đăng ký để thêm vào lịch trong ứng dụng, nhận nhắc giờ, quét QR tại sự kiện để check-in và nhập ghi chú để nhận bản tóm tắt AI. Có một cách tạo sự kiện và mã QR phục vụ demo. Toàn bộ dữ liệu trên các màn hình phải liên thông, không ghép các giao diện giả lập độc lập.

## 2. Phạm vi và quy tắc

| Mức | Tính năng | Điều kiện hoàn thành |
| --- | --- | --- |
| Bắt buộc | Danh sách, tìm kiếm, chi tiết sự kiện | Tìm theo tên; xem thời gian, địa điểm, mô tả, trạng thái đăng ký |
| Bắt buộc | Đăng ký và lịch cá nhân | Một tài khoản chỉ đăng ký một lần; sự kiện xuất hiện trong tab Lịch; có thể hủy nếu chưa check-in |
| Bắt buộc | Nhắc giờ | Lên lịch thông báo trên thiết bị khi đăng ký, hủy khi bỏ đăng ký; nếu từ chối quyền, app vẫn dùng được và hiện trạng thái |
| Bắt buộc | Quét QR và check-in | Chỉ tài khoản đã đăng ký; quét mã chứa token sự kiện; backend xác nhận token, thời gian và trạng thái, chống check-in lặp; trả thông báo lỗi rõ |
| Bắt buộc | Ghi chú và tóm tắt | Người dùng nhập nội dung; backend gọi AI; hiển thị kết quả và cho thử lại khi lỗi; không tạo tóm tắt giả nếu API lỗi |
| Tối thiểu cho demo | Tạo dữ liệu sự kiện và QR | Seed 3 sự kiện với các trạng thái thời gian; trang nội bộ hoặc script in QR để dùng điện thoại khác/màn hình khác quét |
| Sau khi MVP chạy | Bộ lọc, giao diện ban tổ chức, animation, báo cáo, chia sẻ | Chỉ thực hiện nếu còn thời gian hoặc rubric yêu cầu |

Quy tắc demo: check-in mở từ 30 phút trước giờ bắt đầu đến giờ kết thúc; backend dùng giờ máy chủ. QR chỉ chứa một token ngẫu nhiên của sự kiện, không chứa dữ liệu người dùng. Đây là biện pháp chặn check-in sai hoặc lặp trong MVP; QR tĩnh có thể bị chia sẻ, nên không tuyên bố ngăn chặn mọi trường hợp gian lận. Nếu môn yêu cầu mức chống gian lận cao hơn, cần QR đổi theo thời gian hoặc kiểm tra tại điểm tổ chức.

## 3. Công nghệ đề xuất

- Mobile: chốt Expo + React Native + TypeScript + Expo Router, khởi tạo dự án mới bằng create-expo-app. Camera qua gói Expo tương thích SDK đang dùng; thông báo qua Expo Notifications.
- Backend: Node.js + Express + TypeScript + Prisma + SQLite. Một file DB chung nằm tại backend, các điện thoại gọi API và thấy cùng dữ liệu. Không cần cài máy chủ CSDL cho bản demo.
- AI: API gọi từ backend, khóa đặt trong biến môi trường server. Có chế độ demo thủ công rõ nhãn khi không có khóa: chỉ hiển thị thông báo dịch vụ chưa khả dụng, không giả vờ có AI.
- Máy thật và backend phải kết nối được cùng mạng hoặc qua URL truy cập được; không dùng localhost trong cấu hình ứng dụng chạy trên điện thoại.
- Không cần EAS Build ở vòng chạy thử đầu: chạy Expo Go nếu các package tương thích, kiểm tra sớm các API camera/thông báo trên máy thật. Build APK sau khi luồng chính ổn định.

## 4. Màn hình và điều hướng

Tabs: Khám phá, Lịch của tôi, Cá nhân. Stack: Chi tiết sự kiện, Quét QR, Ghi chú và tóm tắt. Trên Lịch, mỗi sự kiện hiện trạng thái Sắp diễn ra / Đã check-in / Đã kết thúc. Nút Quét QR chỉ mở từ sự kiện đã đăng ký; backend vẫn kiểm tra lại mọi điều kiện.

Luồng 1: Khám phá → Chi tiết → Đăng ký → Lịch. Luồng 2: Lịch → Chi tiết → Quét QR → Kết quả check-in. Luồng 3: Sự kiện đã kết thúc → Nhập ghi chú → Tóm tắt → xem lại kết quả.

## 5. Dữ liệu tối thiểu

- User(id, name, email, passwordHash hoặc tài khoản demo được cấp sẵn). Nếu cần tiết kiệm thời gian, seed một người dùng demo và tạm bỏ form đăng ký/đăng nhập; API vẫn gắn người dùng từ cơ chế demo có kiểm soát, không nhận userId bất kỳ từ body.
- Event(id, title, description, location, startsAt, endsAt, qrToken, createdAt). Thời gian lưu UTC, hiển thị giờ Việt Nam.
- Registration(id, userId, eventId, createdAt, checkedInAt nullable); unique(userId, eventId).
- Note(id, userId, eventId, content, summary nullable, updatedAt); unique(userId, eventId). Giới hạn độ dài nội dung đầu vào, chẳng hạn 5.000 ký tự.

## 6. Hợp đồng API tối thiểu

| API | Input chính | Kết quả |
| --- | --- | --- |
| GET /events?q= | Từ khóa tùy chọn | Danh sách sự kiện |
| GET /events/:id | id | Chi tiết và trạng thái đăng ký của người dùng |
| POST /events/:id/register | Không cần body | Đăng ký; gọi lại trả trạng thái hiện có |
| DELETE /events/:id/register | Không cần body | Hủy đăng ký nếu chưa check-in |
| GET /me/registrations | Không cần body | Lịch của tôi |
| POST /events/:id/check-in | { token } | Thời điểm check-in; lỗi 400 token sai, 403 chưa đăng ký, 409 đã check-in, 422 ngoài giờ |
| PUT /events/:id/note | { content } | Lưu ghi chú |
| POST /events/:id/summarize | Không cần body | Gọi AI từ server, lưu và trả summary; lỗi 503 khi dịch vụ lỗi |
| GET /events/:id/note | Không cần body | Ghi chú và summary đã lưu |

Tất cả API trả JSON có dạng nhất quán `{ data, error }`; lỗi có `code` và `message`. Danh tính lấy từ session/token hoặc tài khoản demo cố định ở server, không tin `userId` do ứng dụng gửi. Kiểm tra phân quyền cho đăng ký, note và check-in.

## 7. Bắt đầu từ dự án trống

1. Tạo repository với hai thư mục `mobile/` và `server/`.
2. Tạo Expo app trong `mobile/`, chạy màn hình mặc định bằng Expo Go trên điện thoại thật.
3. Khởi tạo Express TypeScript trong `server/`; cài Prisma, chọn SQLite, tạo schema và seed 3 sự kiện.
4. Kiểm tra điện thoại gọi được `GET /events` qua địa chỉ IP LAN của máy chạy backend.
5. Chỉ sau khi bước 4 chạy được mới chia việc và triển khai các mốc bên dưới.

## 8. Lịch triển khai ngắn theo phụ thuộc

| Mốc | Việc | Người phụ trách gợi ý | Tiêu chí bàn giao |
| --- | --- | --- | --- |
| 0 | Chốt repo, công nghệ, schema, API, seed, URL backend trên điện thoại | Thái + Quốc | App chạy trên máy thật, GET /events trả 3 sự kiện |
| 1 | Danh sách → chi tiết → đăng ký → lịch dùng API thật | Thái điều hướng; Quốc API/UI | Đăng ký một sự kiện và thấy ngay trong Lịch, khởi động lại vẫn còn |
| 2 | QR, kiểm tra server và nhắc giờ | Đạt camera; Quốc endpoint; Thái nối màn hình | Quét đúng thành công; sai, lặp, chưa đăng ký, ngoài giờ báo lỗi; thông báo được lên lịch |
| 3 | Ghi chú → AI → lưu/tải lại | Kha AI và kiểm thử; Quốc endpoint | Có tóm tắt từ ghi chú thật và xử lý API lỗi |
| 4 | Animation nhẹ, build, video, ảnh màn hình, báo cáo | Khôi build/video; Đạt nhật ký; cả nhóm test | APK cài được, demo chạy theo 3 luồng, báo cáo khớp tính năng thực tế |

Quy tắc tích hợp: xong mỗi mốc mới bắt đầu phần phụ thuộc tiếp theo; merge các nhánh theo hợp đồng API đã chốt. Không để 5 người tự làm 5 màn hình với dữ liệu riêng. Sau mốc 1 phải có đường demo trọn vẹn đầu tiên.

## 9. Checklist kiểm thử trước khi quay demo

1. Danh sách và tìm kiếm trả đúng sự kiện; không có dữ liệu hiển thị trạng thái trống.
2. Đăng ký một lần, làm mới app vẫn thấy trong Lịch; hủy đăng ký thì xóa lịch và nhắc giờ.
3. Từ chối quyền thông báo/camera: app không crash; có lời nhắc cấp lại quyền.
4. QR đúng thành công; QR sai, quét hai lần, chưa đăng ký và ngoài khung giờ đều bị server từ chối.
5. AI chỉ dùng ghi chú đã nhập; ghi chú trống bị chặn; mất mạng hoặc AI lỗi có nút thử lại; mở lại app vẫn xem được kết quả đã lưu.
6. Demo trên máy thật với URL backend dùng được; không phụ thuộc vào dữ liệu chỉ còn trong state của máy dev.

## 10. Những quyết định cần chốt từ giảng viên hoặc đề đầy đủ

- Rubric của cột điểm thực hành: bắt buộc Expo/React Native, backend, AI thật, APK, báo cáo và số lượng màn hình ở mức nào?
- Có cần đăng nhập và tài khoản ban tổ chức hay được dùng người dùng demo?
- Check-in QR tĩnh theo sự kiện có được chấp nhận hay cần QR thay đổi theo thời gian?
- Nhắc giờ chỉ bằng thông báo local trên điện thoại hay cần push từ server?

Nếu chưa nhận được câu trả lời, triển khai theo MVP trên và ghi rõ các giả định trong báo cáo. Ưu tiên demo ba luồng đầu tới cuối trước khi thêm tính năng.

## 11. Quy trình Codex triển khai và bàn giao

Trạng thái người dùng đã xác nhận: đã tạo Expo trong mobile/ và chạy reset-project. Khi bắt đầu, kiểm tra repository thực tế, package.json và code hiện có; giữ phần đã làm đúng. Chỉ triển khai mốc được giao, bắt đầu với mốc 0. Dùng phiên bản package tương thích với dự án, giữ lockfile.

Sau mỗi mốc, Codex phải:
1. Đối chiếu tính năng với tiêu chí bàn giao của mốc và ghi việc đã hoàn thành, việc còn thiếu.
2. Chạy typecheck cho mobile và server; chạy lint nếu đã cấu hình; build server nếu mốc có backend. Ghi lệnh thực tế và kết quả.
3. Viết và chạy test cho logic nghiệp vụ có trong mốc; dùng DB test riêng. Không xóa hoặc sửa dữ liệu demo để chạy test. Test API cần kiểm tra cả response và dữ liệu lưu trong DB thực, thay vì mock toàn bộ tầng dữ liệu.
4. Sửa lỗi phát hiện, chạy lại các kiểm tra liên quan. Không bỏ test hoặc nới assertion chỉ để có kết quả pass.
5. Cập nhật README với cách cài, migration, seed, chạy server/mobile và cấu hình API trên máy thật; cung cấp .env.example không chứa khóa thật.
6. Tạo hoặc cập nhật TEST_REPORT.md: mốc, commit nếu có, môi trường/phiên bản, lệnh, số test pass/fail/skip, giới hạn và checklist máy thật. Chỉ đánh dấu PASS khi đã chạy và có kết quả; chưa chạy ghi NOT RUN kèm lý do. Không xem mock AI thành công là bằng chứng API AI thật hoạt động.
7. Bàn giao để người dùng chạy máy thật và gửi code review trước mốc kế tiếp. Phân biệt hoàn thành code với đã xác nhận demo trên thiết bị.

### Phạm vi test theo mốc

| Mốc | Kiểm tra tự động trọng tâm | Kiểm tra trên máy thật |
| --- | --- | --- |
| 0 | Migration trên DB test trống; seed chạy lại không trùng; GET /events trả dữ liệu từ DB và đúng cấu trúc | Expo mở được; điện thoại gọi API qua mạng và hiện 3 sự kiện |
| 1 | Tìm kiếm, id không tồn tại, đăng ký lặp không tạo bản ghi thứ hai, hủy đăng ký, dữ liệu lịch theo người dùng | Đăng ký/hủy cập nhật các màn hình; mở lại app vẫn đúng; loading/error/empty |
| 2 | Token sai, chưa đăng ký, check-in lặp, đúng và ngoài biên thời gian; hai request check-in đồng thời chỉ thành công một lần | Camera quét QR; từ chối quyền; nhận nhắc giờ; hủy đăng ký hủy nhắc giờ |
| 3 | Note trống/quá dài; quyền sở hữu; lưu và đọc lại; mock AI thành công, timeout, lỗi; giữ note khi AI lỗi | Gọi AI thật một lần khi có khóa; thử lỗi/mất mạng và xem lại kết quả đã lưu |
| 4 | Chạy lại bộ test hiện có, typecheck, lint; kiểm tra kết quả build thực tế nếu có môi trường build | Cài bản build và chạy 3 luồng; ghi rõ nếu mới thử trên Expo Go |

Unit test tập trung vào hàm kiểm tra dữ liệu, thời gian và quy tắc nghiệp vụ. Integration test tập trung API và DB. Không đặt mục tiêu 100% coverage cho MVP; ưu tiên trường hợp có thể làm sai dữ liệu hoặc hỏng demo.

### Gói bàn giao để review

Gửi source dạng ZIP gồm mobile/, server/, specs, README, TEST_REPORT.md, package.json, lockfile, schema, migrations, seed và tests. Loại node_modules/, .expo/, thư mục build/cache, .env chứa bí mật và dữ liệu cá nhân. Có thể gửi diff và file liên quan nếu chỉ kiểm tra thay đổi nhỏ. Người review đối chiếu specs, đọc logic, kiểm tra chất lượng test và chạy lại các kiểm tra khi môi trường cho phép; ghi rõ phần chưa thể kiểm chứng. Camera và thông báo cần kết quả thử trên điện thoại của người dùng.
