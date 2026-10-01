import "dotenv/config";
import { summarizeContent, AiServiceError } from "../src/services/ai.js";

async function runRealAiTest() {
  console.log("==================================================================");
  console.log("KIỂM TRA GỌI API AI THỰC TẾ (STUDENT EVENT APP - MỐC 3 KHA)");
  console.log("==================================================================");

  const key =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY;

  if (!key) {
    console.warn("⚠️  CHƯA CẤU HÌNH API KEY!");
    console.warn("Vui lòng mở file server/.env và thêm API key:");
    console.warn("  AI_API_KEY=AIzaSy... (hoặc GEMINI_API_KEY / OPENAI_API_KEY)");
    console.warn("Lấy Google Gemini API key miễn phí tại: https://aistudio.google.com/app/apikey");
    process.exit(1);
  }

  const sampleNote = `Workshop Kỹ năng thuyết trình (Phòng A1.01):
Diễn giả đã chia sẻ 3 trọng tâm chính:
1. Mô hình cấu trúc bài nói Why - What - How: bắt đầu bằng lý do khán giả nên quan tâm, sau đó cung cấp giải pháp và hướng dẫn thực thi.
2. Ngôn ngữ hình thể và giọng điệu: phân bổ ánh mắt đều khán phòng (eye-contact ít nhất 3 giây/vùng), kiểm soát ngữ điệu và tránh nói đều đều gây buồn ngủ.
3. Kỹ thuật thiết kế slide: nguyên tắc 1 ý tưởng/1 slide, sử dụng hình ảnh minh họa thực tế thay vì chèn quá nhiều chữ (tối đa 6 dòng).
Bài tập về nhà: Sinh viên chuẩn bị bài thuyết trình 3 phút về đề tài nhóm cho buổi học tuần tới.`;

  console.log("📄 Nội dung ghi chú gửi tới AI:\n");
  console.log(sampleNote);
  console.log("\n⏳ Đang gửi yêu cầu tới dịch vụ AI...");

  const startTime = Date.now();
  try {
    const summary = await summarizeContent(sampleNote);
    const duration = Date.now() - startTime;

    console.log("\n==================================================================");
    console.log(`✅ GỌI AI THÀNH CÔNG (Thời gian phản hồi: ${duration}ms)`);
    console.log("==================================================================");
    console.log("🤖 BẢN TÓM TẮT TỪ AI:\n");
    console.log(summary);
    console.log("\n==================================================================");
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ GỌI AI THẤT BẠI sau ${duration}ms:`);
    if (error instanceof AiServiceError) {
      console.error(`- Mã lỗi: ${error.code} (HTTP ${error.statusCode})`);
      console.error(`- Thông điệp: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

void runRealAiTest();
