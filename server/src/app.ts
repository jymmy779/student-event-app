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
