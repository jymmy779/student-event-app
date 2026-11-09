# Hướng dẫn cấu hình và kiểm thử tính năng Ghi chú & Tóm tắt AI

**Người phụ trách:** Lê Thanh Kha  
**Nhánh:** `feature/ai-notes`  
**Tính năng:** Màn nhập/xem ghi chú, API lưu/đọc note, tích hợp AI Google Gemini tóm tắt nội dung, validation và xử lý lỗi.

---

## 1. Cấu hình khóa Google Gemini API

Ứng dụng sử dụng Google Gemini REST API trực tiếp từ backend (Node.js native `fetch`), tương thích với các model mới nhất của Google (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`).

### Cách lấy API Key miễn phí
1. Truy cập [Google AI Studio](https://aistudio.google.com/).
2. Đăng nhập bằng tài khoản Google.
3. Bấm **Get API key** và chọn **Create API key in new project**.
4. Sao chép chuỗi khóa API vừa tạo.

### Cấu hình trên máy chủ backend
Mở file `server/.env` (tạo từ `server/.env.example` nếu chưa có) và bổ sung:

```dotenv
DATABASE_URL="file:./dev.db"
PORT=3000
GEMINI_API_KEY="AIzaSy... (hoặc khóa do Google cấp)"
# Tùy chọn (mặc định gemini-3.5-flash-lite):
GEMINI_MODEL="gemini-3.5-flash-lite"
```

> [!IMPORTANT]
> **Chế độ khi chưa có khóa (Graceful Fallback)**:  
> Nếu `GEMINI_API_KEY` để trống hoặc chưa cấu hình, server sẽ trả lỗi HTTP `503` với mã `AI_SERVICE_UNAVAILABLE` và thông báo dịch vụ AI chưa khả dụng. Hệ thống **tuyệt đối không sinh tóm tắt giả lập**, đảm bảo tính trung thực theo đúng yêu cầu `EVENT_APP_MVP_SPEC.md`.

---

## 2. Danh mục API Endpoints

Mọi API đều trả về cấu trúc phong bì nhất quán `{ data, error }`.

| Method | Endpoint | Mô tả | Mã lỗi chính |
| --- | --- | --- | --- |
| `GET` | `/events/:id/note` | Lấy ghi chú và bản tóm tắt của user cho sự kiện | `404 EVENT_NOT_FOUND` |
| `PUT` | `/events/:id/note` | Lưu/cập nhật ghi chú (1 – 5.000 ký tự) | `400 NOTE_EMPTY`<br>`400 NOTE_TOO_LONG`<br>`404 EVENT_NOT_FOUND` |
| `POST` | `/events/:id/summarize` | Gọi Gemini AI tóm tắt ghi chú đã lưu | `400 NOTE_EMPTY`<br>`503 AI_SERVICE_UNAVAILABLE`<br>`504 AI_TIMEOUT`<br>`503 AI_SERVICE_ERROR` |

### Bảng mã lỗi chuẩn hóa

- `NOTE_EMPTY`: Nội dung ghi chú rỗng hoặc chỉ chứa khoảng trắng khi lưu hoặc tóm tắt.
- `NOTE_TOO_LONG`: Nội dung ghi chú vượt quá giới hạn 5.000 ký tự.
- `EVENT_NOT_FOUND`: Không tìm thấy mã sự kiện trong cơ sở dữ liệu.
- `AI_SERVICE_UNAVAILABLE`: Backend chưa được cấu hình `GEMINI_API_KEY`.
- `AI_TIMEOUT`: Quá thời gian chờ phản hồi từ AI (mặc định 15 giây).
- `AI_SERVICE_ERROR`: Lỗi từ nhà cung cấp dịch vụ AI (hết quota, mạng, sai định dạng).

---

## 3. Bằng chứng gọi thật (Real AI Call Verification)

Kiểm tra trực tiếp thông qua test script gọi vào ứng dụng Express và kết nối trực tiếp đến Google Gemini API bằng khóa thật:

```text
Testing with event: event-past-workshop
PUT Note status: 200
Calling real AI summarize...
Summarize status: 200
AI Summary generated:
* Hướng dẫn kỹ năng thuyết trình trước đám đông
* Bí quyết làm chủ ngôn ngữ cơ thể hiệu quả
* Cách thiết kế slide tinh gọn và thu hút người xem
```

---

## 4. Hướng dẫn kiểm thử thủ công qua cURL / PowerShell

Khởi động backend:
```bash
cd server
npm run dev
```

### 1. Lưu ghi chú mới:
```powershell
Invoke-RestMethod -Method Put -Uri "http://localhost:3000/events/event-past-workshop/note" -Headers @{"Content-Type"="application/json"} -Body '{"content":"Tham gia buổi chia sẻ về lập trình ứng dụng di động React Native và Expo SDK 57."}'
```

Phản hồi:
```json
{
  "data": {
    "id": "cm...",
    "userId": "user-demo-1",
    "eventId": "event-past-workshop",
    "content": "Tham gia buổi chia sẻ về lập trình ứng dụng di động React Native và Expo SDK 57.",
    "summary": null,
    "updatedAt": "2026-11-01T15:20:00.000Z"
  },
  "error": null
}
```

### 2. Yêu cầu AI tóm tắt:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/events/event-past-workshop/summarize"
```

Phản hồi:
```json
{
  "data": {
    "id": "cm...",
    "userId": "user-demo-1",
    "eventId": "event-past-workshop",
    "content": "Tham gia buổi chia sẻ về lập trình ứng dụng di động React Native và Expo SDK 57.",
    "summary": "* Tham gia workshop học lập trình ứng dụng di động với React Native\n* Thực hành sử dụng Expo SDK 57 để xây dựng app",
    "updatedAt": "2026-11-01T15:20:05.000Z"
  },
  "error": null
}
```

### 3. Đọc lại ghi chú và tóm tắt:
```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/events/event-past-workshop/note"
```
