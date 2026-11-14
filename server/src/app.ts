import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { eventsRouter } from "./routes/events.js";
import { registrationsRouter } from "./routes/registrations.js";
import { authRouter } from "./routes/auth.js";
import { organizerRouter } from "./routes/organizer.js";
import { accountRouter } from "./routes/account.js";
import { notesRouter } from "./routes/notes.js";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/check-in", (request, response) => {
  const eventId = typeof request.query.eventId === "string" ? request.query.eventId : "";
  const token = typeof request.query.token === "string" ? request.query.token : "";
  const appLink = `student-event://check-in?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(token)}`;
  response.type("html").send(`<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Student Event</title>
<style>body{font-family:Arial,sans-serif;background:#f5f7fb;color:#172554;display:grid;place-items:center;min-height:100vh;margin:0;padding:20px}.card{background:#fff;border-radius:20px;box-shadow:0 8px 30px #17255418;max-width:420px;padding:28px;text-align:center}h1{font-size:24px}p{color:#475569;line-height:1.6}.button{background:#1d4ed8;border-radius:10px;color:#fff;display:inline-block;font-weight:700;padding:13px 18px;text-decoration:none}</style>
</head><body><main class="card"><div style="font-size:48px">📱</div><h1>Cần sử dụng app Student Event</h1><p>QR này phải được quét bằng ứng dụng Student Event để check-in sự kiện.</p><a class="button" href="${appLink}">Mở Student Event</a></main></body></html>`);
});

app.use(eventsRouter);
app.use(authRouter);
app.use(organizerRouter);
app.use(accountRouter);
app.use(registrationsRouter);
app.use(notesRouter);

app.use((_request, response) =>
  response
    .status(404)
    .json({
      data: null,
      error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." },
    }),
);
app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error(error);
    response
      .status(500)
      .json({
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Máy chủ gặp lỗi. Vui lòng thử lại.",
        },
      });
  },
);
