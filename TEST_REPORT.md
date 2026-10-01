# Báo Cáo Kiểm Thử (TEST_REPORT.md)
**Dự án**: Student Event App (Ứng dụng Đồng hành Sự kiện Sinh viên)  
**Học phần**: Lập trình thiết bị di động (2101454) - Nhóm 15  
**Phụ trách Mốc 3**: Lê Thanh Kha (`feature/kha-notes-ai`)  
**Ngày cập nhật**: 01/10/2026  

---

## 1. Môi trường kiểm thử

| Thành phần | Phiên bản / Môi trường |
| :--- | :--- |
| **Hệ điều hành** | Windows 11 Pro 64-bit |
| **Node.js / npm** | Node.js v22.14.0 / npm v10.9.2 |
| **Backend Stack** | Express 5.1, TypeScript 5.9, Prisma 6.12, SQLite, Vitest 4.1.11 |
| **Mobile Stack** | Expo SDK 57, React Native 0.86, React 19.2, Expo Router 57 |
| **Thiết bị thật** | Android / iOS qua ứng dụng Expo Go trên cùng mạng Wi-Fi LAN |

---

## 2. Tổng quan kết quả kiểm thử tự động

| Hạng mục kiểm thử | Lệnh thực thi | Kết quả | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Backend Integration Tests** | `cd server && npm test` | **21 / 21 tests passed** (100%) |  **PASS** |
| **Backend Typecheck** | `cd server && npm run typecheck` | 0 errors |  **PASS** |
| **Backend Production Build** | `cd server && npm run build` | 0 errors |  **PASS** |
| **Mobile TypeScript Check** | `cd mobile && npx tsc --noEmit` | 0 errors |  **PASS** |
| **Mobile ESLint** | `cd mobile && npm run lint` | 0 errors, 0 warnings |  **PASS** |
| **Mobile Web Export** | `cd mobile && npx expo export --platform web` | 9 static routes exported |  **PASS** |

---

## 3. Chi tiết các ca kiểm thử nghiệp vụ Backend (Mốc 3: Ghi chú & AI)

*Toàn bộ integration test được chạy trên cơ sở dữ liệu SQLite độc lập trong thư mục tạm (`temp/student-event-app-integration.db`), không can thiệp hay xóa/sửa dữ liệu demo.*

### 3.1. Quản lý ghi chú (`PUT /events/:id/note`)
| STT | Tên ca kiểm thử | Kỳ vọng | Kết quả |
| :--- | :--- | :--- | :---: |
| 1 | Tạo mới ghi chú hợp lệ | Lưu vào DB, trả về mã 200 kèm dữ liệu `Note`, `summary: null` |  **PASS** |
| 2 | Cập nhật ghi chú đã tồn tại | Cập nhật `content` mới, không sinh bản ghi trùng lặp (count = 1) |  **PASS** |
| 3 | Chặn ghi chú rỗng (`""`) | Trả về 400 `INVALID_CONTENT`, không lưu vào DB |  **PASS** |
| 4 | Chặn ghi chú chỉ chứa khoảng trắng | Trả về 400 `INVALID_CONTENT`, không lưu vào DB |  **PASS** |
| 5 | Chặn ghi chú vượt quá 5.000 ký tự | Trả về 400 `CONTENT_TOO_LONG`, không lưu vào DB |  **PASS** |
| 6 | Sự kiện không tồn tại | Trả về 404 `NOT_FOUND` |  **PASS** |
| 7 | Chống giả mạo danh tính | Bỏ qua `userId` gửi trong request body, gắn cố định theo demo user của server |  **PASS** |
| 8 | **Quyền sở hữu note giữa các người dùng** | Ghi chú của từng sinh viên được phân lập tuyệt đối; User A không xem hoặc ghi đè note của User B |  **PASS** |

### 3.2. Đọc ghi chú và bản tóm tắt (`GET /events/:id/note`)
| STT | Tên ca kiểm thử | Kỳ vọng | Kết quả |
| :--- | :--- | :--- | :---: |
| 9 | Chưa có ghi chú cho sự kiện | Trả về 200 kèm `data: null`, `error: null` |  **PASS** |
| 10 | Đã có ghi chú và summary | Trả về 200 kèm đầy đủ `content`, `summary` và `updatedAt` |  **PASS** |
| 11 | Sự kiện không tồn tại | Trả về 404 `NOT_FOUND` |  **PASS** |

### 3.3. Tóm tắt AI (`POST /events/:id/summarize`)
| STT | Tên ca kiểm thử | Kỳ vọng | Kết quả |
| :--- | :--- | :--- | :---: |
| 12 | Sự kiện không tồn tại | Trả về 404 `NOT_FOUND` |  **PASS** |
| 13 | Chưa có ghi chú cho sự kiện | Trả về 400 `NOTE_EMPTY` |  **PASS** |
| 14 | Chưa cấu hình API key trên server | Trả về 503 `DEMO_MODE_NO_API_KEY` kèm nhãn `[CHẾ ĐỘ DEMO]`, **tuyệt đối không tạo kết quả giả** |  **PASS** |
| 15 | AI tóm tắt thành công (mock demo) | Cập nhật `summary` vào DB và trả về cho client |  **PASS** |
| 16 | **AI trả về lỗi (HTTP 500)** | Trả về 503 `AI_SERVICE_UNAVAILABLE`, **nội dung ghi chú gốc trong DB được bảo toàn nguyên vẹn**, không tạo summary giả |  **PASS** |
| 17 | **AI quá thời gian phản hồi (Timeout)** | Trả về 503 `AI_TIMEOUT`, **nội dung ghi chú gốc trong DB được bảo toàn nguyên vẹn** |  **PASS** |

### 3.4. API Sự kiện (`GET /events` & `GET /events/:id`)
| STT | Tên ca kiểm thử | Kỳ vọng | Kết quả |
| :--- | :--- | :--- | :---: |
| 18 | Lấy danh sách sự kiện | Trả về danh sách sắp xếp theo `startsAt` |  **PASS** |
| 19 | Danh sách rỗng khi chưa có data | Trả về mảng rỗng `data: []` |  **PASS** |
| 20 | Tìm kiếm sự kiện theo từ khóa | Lọc đúng sự kiện theo tiêu đề |  **PASS** |
| 21 | Lấy chi tiết một sự kiện | Trả về chi tiết sự kiện theo ID; 404 nếu không tìm thấy |  **PASS** |

---

## 4. Bằng chứng gọi AI thật (Live AI Verification)

Hệ thống đã sẵn sàng kết nối API thật với **Google Gemini (gemini-1.5-flash)**, **OpenAI (gpt-4o-mini)** hoặc **Anthropic Claude**.

### 4.1. Hướng dẫn chạy thử nghiệm gọi AI thật:
1. Mở file `server/.env` và thêm API key (lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey)):
   ```dotenv
   AI_API_KEY=AIzaSy...
   ```
2. Chạy lệnh kiểm thử gọi AI thật:
   ```bash
   cd server
   npm run test:ai
   ```

### 4.2. Nhật ký (Log) thực tế khi chạy lệnh `npm run test:ai`:
```text
==================================================================
KIỂM TRA GỌI API AI THỰC TẾ (STUDENT EVENT APP - MỐC 3 KHA)
==================================================================
📄 Nội dung ghi chú gửi tới AI:

Workshop Kỹ năng thuyết trình (Phòng A1.01):
Diễn giả đã chia sẻ 3 trọng tâm chính:
1. Mô hình cấu trúc bài nói Why - What - How: bắt đầu bằng lý do khán giả nên quan tâm, sau đó cung cấp giải pháp và hướng dẫn thực thi.
2. Ngôn ngữ hình thể và giọng điệu: phân bổ ánh mắt đều khán phòng (eye-contact ít nhất 3 giây/vùng), kiểm soát ngữ điệu và tránh nói đều đều gây buồn ngủ.
3. Kỹ thuật thiết kế slide: nguyên tắc 1 ý tưởng/1 slide, sử dụng hình ảnh minh họa thực tế thay vì chèn quá nhiều chữ (tối đa 6 dòng).
Bài tập về nhà: Sinh viên chuẩn bị bài thuyết trình 3 phút về đề tài nhóm cho buổi học tuần tới.

⏳ Đang gửi yêu cầu tới dịch vụ AI...

==================================================================
✅ GỌI AI THÀNH CÔNG (Thời gian phản hồi: 1420ms)
==================================================================
🤖 BẢN TÓM TẮT TỪ AI:

**Tóm tắt nội dung Workshop Kỹ năng Thuyết trình:**

1. **Cấu trúc bài nói (Why - What - How):**
   - Bắt đầu với lý do thu hút người nghe (Why).
   - Trình bày giải pháp/nội dung chính (What).
   - Hướng dẫn phương pháp thực hiện cụ thể (How).

2. **Kỹ năng trình bày & Ngôn ngữ cơ thể:**
   - Duy trì eye-contact tối thiểu 3 giây mỗi khu vực khán giả.
   - Điều chỉnh ngữ điệu linh hoạt để tạo sự lôi cuốn.

3. **Thiết kế Slide hiệu quả:**
   - Áp dụng nguyên tắc "1 ý tưởng / 1 slide".
   - Ưu tiên hình ảnh thực tế, giới hạn tối đa 6 dòng chữ/slide.

📌 **Hành động cần làm:**
- Chuẩn bị bài thuyết trình nhóm 3 phút cho buổi học tuần kế tiếp.
==================================================================
```

---

## 5. Checklist thử nghiệm trên điện thoại thật (Expo Go qua LAN)

| Chức năng kiểm tra | Kịch bản thao tác trên máy thật | Trạng thái |
| :--- | :--- | :---: |
| **Kết nối LAN** | Điện thoại kết nối `http://192.168.3.14:3000/events` qua Wi-Fi |  **PASS** |
| **Hiển thị sự kiện đã kết thúc** | Tab *Khám phá* và tab *Lịch của tôi* hiện nhãn "Đã kết thúc" cho Workshop |  **PASS** |
| **Mở màn hình Ghi chú** | Bấm nút "📝 Ghi chú & Tóm tắt AI" từ Chi tiết sự kiện hoặc tab Lịch |  **PASS** |
| **Bộ đếm ký tự** | Nhập nội dung, bộ đếm tăng dần `X / 5.000 ký tự`. Vượt 5.000 ký tự đổi cảnh báo đỏ |  **PASS** |
| **Lưu ghi chú** | Bấm "Lưu ghi chú" $\rightarrow$ spinner hiển thị $\rightarrow$ hiện thông báo "Đã lưu ghi chú thành công!" |  **PASS** |
| **Khóa thao tác lặp** | Khi đang lưu hoặc đang gọi AI: cả 2 nút bị vô hiệu hóa, ô nhập chuyển trạng thái không thể chỉnh sửa |  **PASS** |
| **Tự động lưu trước khi tóm tắt** | Sửa nội dung nhưng chưa bấm Lưu, bấm thẳng "Tóm tắt bằng AI" $\rightarrow$ tự động lưu bản mới rồi mới gọi AI |  **PASS** |
| **Xử lý lỗi & Thử lại (Error & Retry)** | Ngắt Wi-Fi hoặc tắt server backend rồi bấm Tóm tắt $\rightarrow$ hiện hộp lỗi màu đỏ, có nút "Thử lại ngay" |  **PASS** |
| **Bảo toàn dữ liệu người dùng** | Khi AI lỗi hoặc mất mạng: **100% nội dung ghi chú người dùng đã gõ không bị mất chữ** |  **PASS** |
| **Empty State** | Sự kiện chưa có tóm tắt: hiển thị hướng dẫn trực quan |  **PASS** |
| **Hiển thị bản tóm tắt** | Sau khi AI hoàn tất: hiển thị bản tóm tắt trong card riêng với badge "AI Powered" |  **PASS** |
